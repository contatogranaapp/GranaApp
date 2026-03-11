// src/app/api/chat/route.ts
import { genAI, AI_MODEL } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    // Gemini usa "model" onde o frontend usa "assistant"
    // Filtramos o history: excluímos o último item (que é a mensagem atual do user)
    // e garantimos que comece sempre com "user" (descartando mensagens iniciais do assistant)
    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Gemini exige que o primeiro item do history seja "user"
    // Remove quaisquer mensagens iniciais do "model" até achar um "user"
    while (history.length > 0 && history[0].role === "model") {
      history = history.slice(1);
    }

    const lastMessage = messages[messages.length - 1].content;

    const balance = (context?.summary?.total_income ?? 0) - (context?.summary?.total_expense ?? 0);
    
    // Monta contexto financeiro para o system prompt
    const ctxStr = context?.summary
      ? `
Você é o Assistente Grana, uma IA financeira pessoal inteligente e empática para brasileiros.
Você tem acesso aos dados financeiros REAIS do usuário referentes ao mês atual.

=== DADOS FINANCEIROS DO USUÁRIO (MÊS ATUAL) ===
- Nome: ${context.profile?.name ?? "Usuário"}
- Receitas do mês: R$ ${context.summary.total_income?.toFixed(2) ?? "0,00"}
- Gastos do mês: R$ ${context.summary.total_expense?.toFixed(2) ?? "0,00"}
- Saldo do mês: R$ ${balance.toFixed(2)}
- Taxa de poupança: ${context.summary.savings_rate?.toFixed(1) ?? "0"}%
- Situação: ${balance >= 0 ? "positivo" : "negativo"}

=== GASTOS POR CATEGORIA ===
${
  context.summary.by_category?.length
    ? context.summary.by_category
        .map((c: any) => `- ${c.category_name}: R$ ${c.total?.toFixed(2)} (${c.percent_of_total?.toFixed(0)}%)`)
        .join("\n")
    : "- Nenhum gasto registrado por categoria"
}

=== ÚLTIMAS TRANSAÇÕES ===
${
  context.recentTransactions?.length
    ? context.recentTransactions
        .slice(0, 5)
        .map((t: any) => `- ${t.date}: ${t.description} — R$ ${t.amount?.toFixed(2)} (${t.type === 'income' ? 'Receita' : 'Gasto'})`)
        .join("\n")
    : "- Nenhuma transação recente"
}
================================================

=== SUA CAPACIDADE DE CRIAR LANÇAMENTOS ===
Você PODE e DEVE criar lançamentos diretamente quando o usuário mencionar um gasto ou receita.

Quando o usuário disser algo como "gastei X reais em Y", "paguei X em Y", "recebi X de Y",
"comprei Y por X", etc., você deve:

1. Responder de forma natural confirmando o lançamento
2. Incluir no FINAL da sua resposta, separado por "|||JSON|||", um objeto JSON com a transação:

Formato obrigatório:
|||JSON|||
{
  "action": "CREATE_TRANSACTION",
  "transaction": {
    "tipo": "gasto",
    "valor": 150.00,
    "categoria": "Alimentação",
    "descricao": "Cartão da Maze",
    "data": "2026-03-11"
  }
}
|||END_JSON|||

Regras para preencher o JSON:
- "tipo": sempre "gasto" ou "receita"
- "valor": número sem R$ nem vírgula (ex: 150.00)
- "categoria": DEVE ser exatamente um destes valores:
  "Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Educação", "Assinaturas", "Outros"
- "descricao": texto livre descrevendo o lançamento
- "data": data de hoje no formato YYYY-MM-DD

Exemplos de mapeamento de categoria:
- Mercado, restaurante, lanche, ifood → "Alimentação"
- Uber, gasolina, ônibus, cartão da Maze (se for transporte) → "Transporte"
- Aluguel, condomínio, luz, água → "Moradia"
- Farmácia, médico, plano de saúde → "Saúde"
- Cinema, netflix, jogos, passeio → "Lazer"
- Curso, livro, faculdade → "Educação"
- Spotify, streaming, assinatura → "Assinaturas"
- Salário, freela → "Outros" (ou mapeie como Receita)
- Qualquer outra coisa → "Outros"

Se não tiver certeza da categoria, use "Outros".
Se o usuário não informar a data, use a data de hoje.
Se a mensagem NÃO for sobre criar um lançamento, NÃO inclua o bloco |||JSON|||.

INSTRUÇÕES:
- Use SEMPRE os dados reais acima para responder perguntas sobre finanças
- Seja direto, empático e use linguagem natural em português do Brasil
- Dê insights acionáveis baseados nos dados reais
- Se o usuário perguntar sobre gastos, receitas ou saldo, use os números reais acima
- Nunca diga que não tem acesso aos dados — você tem, estão listados acima
`
      : `
Você é o Assistente Grana, uma IA financeira pessoal inteligente e empática para brasileiros.
O usuário ainda não possui transações registradas este mês.
Encoraje-o a registrar seus gastos e receitas para receber insights personalizados.
Responda em português do Brasil de forma amigável.
`;

    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      systemInstruction: ctxStr,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    // Retorna no formato SSE que o ChatInterface espera
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("=== GEMINI CHAT ERROR ===");
    console.error("Status:", err?.status);
    console.error("Message:", err?.message);
    console.error("Error name:", err?.name);
    console.error("Full error:", JSON.stringify(err, null, 2));
    console.error("========================");
    return Response.json(
      { error: err?.message || "Erro ao contatar a API do Gemini." },
      { status: 500 }
    );
  }
}
