import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

type RetrievedContext = { knowledge: Array<{ title: string; source: string; content: string }>; products: any[]; projects: any[] };

@Injectable()
export class AiService {
  private readonly api = 'https://api.openai.com/v1';
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private key() { const key = this.config.get<string>('OPENAI_API_KEY'); if (!key) throw new ServiceUnavailableException('AI assistant is not configured'); return key; }
  private async openai(path: string, body: unknown) {
    const response = await fetch(`${this.api}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${this.key()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(Number(this.config.get('OPENAI_TIMEOUT_MS', '30000'))) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new ServiceUnavailableException(payload?.error?.message || 'AI provider request failed');
    return payload;
  }
  async embed(input: string) { const result = await this.openai('/embeddings', { model: this.config.get('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'), input }); return result.data[0].embedding as number[]; }

  private chunk(text: string) { const words = text.replace(/\s+/g, ' ').trim().split(' '); const chunks: string[] = []; for (let i = 0; i < words.length; i += 220) chunks.push(words.slice(i, i + 260).join(' ')); return chunks.filter(Boolean); }
  async indexDocument(documentId: string) {
    const doc = await this.prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: documentId } });
    await this.prisma.knowledgeChunk.deleteMany({ where: { documentId } });
    for (const [chunkIndex, content] of this.chunk(`${doc.title}\n${doc.content}`).entries()) {
      const embedding = await this.embed(content);
      const chunk = await this.prisma.knowledgeChunk.create({ data: { documentId, content, chunkIndex } });
      await this.prisma.$executeRawUnsafe(`UPDATE "KnowledgeChunk" SET "embedding" = $1::vector WHERE "id" = $2`, `[${embedding.join(',')}]`, chunk.id);
    }
    return this.prisma.knowledgeDocument.findUnique({ where: { id: documentId }, include: { chunks: { select: { id: true, chunkIndex: true } } } });
  }
  async removeDocument(documentId: string) { await this.prisma.knowledgeDocument.delete({ where: { id: documentId } }); return { id: documentId, deleted: true }; }

  async retrieve(query: string): Promise<RetrievedContext> {
    const embedding = await this.embed(query);
    const chunks = await this.prisma.$queryRawUnsafe<Array<{ content: string; title: string; source: string }>>(`SELECT c.content, d.title, d.source FROM "KnowledgeChunk" c JOIN "KnowledgeDocument" d ON d."id" = c."documentId" WHERE d."status" = 'PUBLISHED' AND c."embedding" IS NOT NULL ORDER BY c."embedding" <=> $1::vector LIMIT 6`, `[${embedding.join(',')}]`);
    const terms = query.split(/\s+/).filter(x => x.length > 2).slice(0, 8);
    const search = terms.length ? terms.join(' ') : query;
    const [products, projects] = await Promise.all([
      this.prisma.catalogueProduct.findMany({ where: { status: 'PUBLISHED', OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] }, include: { images: { orderBy: { sortOrder: 'asc' } }, category: true }, take: 6 }),
      this.prisma.project.findMany({ where: { status: 'PUBLISHED', OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }, { propertyType: { contains: search, mode: 'insensitive' } }, { designStyle: { contains: search, mode: 'insensitive' } }] }, include: { media: { orderBy: { sortOrder: 'asc' } }, services: true }, take: 4 }),
    ]);
    return { knowledge: chunks, products, projects };
  }

  async respond(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
    const query = messages.at(-1)?.content ?? '';
    const context = await this.retrieve(query);
    const system = `You are My First Home Design Assistant, a professional, friendly premium interior designer. Use only the VERIFIED CONTEXT below for company facts. Never invent products, SKUs, prices, availability, warranties, projects, services, or timelines. If a fact is missing, say that the company must confirm it. General design advice is allowed only when clearly labelled as general design advice. Recommend verified products with their exact name, image URL, SKU, material, finish, verified price, availability and a short reason; omit fields that are unavailable. Suggest a free consultation when useful.\n\nVERIFIED CONTEXT:\n${JSON.stringify(context)}`;
    const result = await this.openai('/responses', { model: this.config.get('OPENAI_MODEL', 'gpt-4.1-mini'), instructions: system, input: messages, temperature: 0.2 });
    const text = result.output_text || result.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || '').join('') || 'I could not generate a response right now.';
    return { text, products: context.products, projects: context.projects };
  }
}
