<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase'

const router = useRouter()

/* URL do produto no Hotmart — substitua pelo link real após criar o produto */
const HOTMART_CHECKOUT_URL = 'https://pay.hotmart.com/SEU_PRODUTO_ID'

const faqAberta = ref(null)

const faqs = [
  {
    q: 'Como funciona a assinatura?',
    r: 'Você assina mensalmente por R$ 25,00. Após o pagamento confirmado pela Hotmart, seu acesso é liberado automaticamente em segundos.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    r: 'Sim. Você pode cancelar sua assinatura a qualquer momento pelo painel da Hotmart, sem multa ou fidelidade. O acesso fica ativo até o fim do período pago.',
  },
  {
    q: 'Como é feito o pagamento?',
    r: 'O pagamento é processado com segurança pela Hotmart — líder em pagamentos digitais no Brasil — e aceita cartão de crédito, boleto bancário e Pix.',
  },
  {
    q: 'Tenho garantia de reembolso?',
    r: 'Sim! Oferecemos 7 dias de garantia incondicional. Se não ficar satisfeito, basta solicitar o reembolso diretamente pela Hotmart.',
  },
  {
    q: 'Preciso instalar alguma coisa?',
    r: 'Não. O AgeJur é um aplicativo web (PWA) que funciona direto no navegador e pode ser instalado na tela inicial do seu celular sem precisar da App Store ou Google Play.',
  },
  {
    q: 'Meus dados ficam seguros?',
    r: 'Sim. Utilizamos o Firebase do Google com criptografia de ponta e regras rígidas de segurança. Nenhum outro usuário pode ver seus processos.',
  },
]

function toggleFaq(i) {
  faqAberta.value = faqAberta.value === i ? null : i
}

function irParaApp() {
  if (auth.currentUser) router.push('/')
  else router.push('/login')
}

function assinar() {
  window.open(HOTMART_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="planos-page">

    <!-- ── HEADER ── -->
    <header class="planos-header">
      <div class="planos-header-inner">
        <div class="planos-logo">
          <span>⚖️</span>
          <strong>Agenda Jurídica</strong>
        </div>
        <button class="btn-header-link" @click="irParaApp">
          {{ auth.currentUser ? '← Voltar ao app' : 'Entrar' }}
        </button>
      </div>
    </header>

    <!-- ── HERO ── -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">Plano Professional</div>
        <h1 class="hero-title">
          Gerencie seus prazos<br>
          e audiências com<br>
          <span class="hero-highlight">tranquilidade total</span>
        </h1>
        <p class="hero-sub">
          O AgeJur é a agenda jurídica feita para advogados brasileiros.
          Controle prazos, audiências e compartilhe processos com sua equipe
          — tudo em tempo real, de qualquer dispositivo.
        </p>
        <button class="btn-cta" @click="assinar">
          Assinar por R$ 25/mês
        </button>
        <p class="hero-garantia">✅ 7 dias de garantia · Cancele quando quiser</p>
      </div>
    </section>

    <!-- ── FEATURES ── -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">Tudo que você precisa na advocacia</h2>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">⏳</div>
            <h3>Controle de Prazos</h3>
            <p>Cadastre prazos processuais com alertas visuais de urgência: vencido, hoje, próximos dias. Nunca perca um prazo.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎤</div>
            <h3>Agenda de Audiências</h3>
            <p>Organize audiências presenciais e online com data, horário e local. Link de acesso à reunião com um clique.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>Sincronização em Tempo Real</h3>
            <p>Atualizações instantâneas via Firebase. Abra no celular, tablet ou computador — tudo sempre sincronizado.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3>Compartilhamento com Equipe</h3>
            <p>Compartilhe prazos e audiências com colegas como editor ou visualizador. Controle de quem pode editar.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📎</div>
            <h3>Protocolo de Conclusão</h3>
            <p>Ao concluir um prazo, registre o número ou texto do protocolo para auditoria futura.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📲</div>
            <h3>App Instalável (PWA)</h3>
            <p>Instale direto na tela inicial do seu celular. Funciona como app nativo, sem depender de App Store.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── PRICING ── -->
    <section class="pricing-section">
      <div class="container">
        <h2 class="section-title">Um plano simples e acessível</h2>
        <p class="section-sub">Sem surpresas, sem limitações escondidas.</p>

        <div class="pricing-cards">

          <!-- Gratuito -->
          <div class="pricing-card">
            <div class="plan-name">Gratuito</div>
            <div class="plan-price">R$ 0</div>
            <div class="plan-period">para sempre</div>
            <ul class="plan-features">
              <li class="ok">✓ Até 5 prazos pendentes</li>
              <li class="ok">✓ Até 3 audiências futuras</li>
              <li class="ok">✓ Sincronização em tempo real</li>
              <li class="no">✗ Compartilhamento com equipe</li>
              <li class="no">✗ Itens ilimitados</li>
            </ul>
            <button class="btn-plan-outline" @click="irParaApp">
              {{ auth.currentUser ? 'Continuar grátis' : 'Criar conta grátis' }}
            </button>
          </div>

          <!-- Pro -->
          <div class="pricing-card featured">
            <div class="plan-badge-top">Mais popular</div>
            <div class="plan-name">Professional</div>
            <div class="plan-price">R$ 25</div>
            <div class="plan-period">por mês</div>
            <ul class="plan-features">
              <li class="ok">✓ Prazos ilimitados</li>
              <li class="ok">✓ Audiências ilimitadas</li>
              <li class="ok">✓ Sincronização em tempo real</li>
              <li class="ok">✓ Compartilhamento com equipe</li>
              <li class="ok">✓ Suporte prioritário</li>
              <li class="ok">✓ Atualizações incluídas</li>
            </ul>
            <button class="btn-cta" @click="assinar">
              Assinar agora
            </button>
            <p class="plan-garantia">7 dias de garantia incondicional</p>
          </div>

        </div>
      </div>
    </section>

    <!-- ── SOCIAL PROOF ── -->
    <section class="proof-section">
      <div class="container">
        <h2 class="section-title">Feito para a rotina do advogado</h2>
        <div class="proof-grid">
          <div class="proof-item">
            <div class="proof-icon">⚖️</div>
            <p>"Finalmente uma agenda jurídica que funciona de verdade no celular. Uso todos os dias."</p>
            <strong>— Advogado, OAB/SP</strong>
          </div>
          <div class="proof-item">
            <div class="proof-icon">🏛️</div>
            <p>"Compartilho os prazos com minha estagiária em tempo real. Economizei horas de trabalho."</p>
            <strong>— Advogada, OAB/RJ</strong>
          </div>
          <div class="proof-item">
            <div class="proof-icon">📋</div>
            <p>"Os alertas de urgência são excelentes. Nunca mais perdi um prazo desde que comecei a usar."</p>
            <strong>— Advogado, OAB/MG</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ── -->
    <section class="faq-section">
      <div class="container faq-container">
        <h2 class="section-title">Perguntas frequentes</h2>

        <div class="faq-list">
          <div
            v-for="(item, i) in faqs"
            :key="i"
            class="faq-item"
            :class="{ open: faqAberta === i }"
            @click="toggleFaq(i)"
          >
            <div class="faq-q">
              <span>{{ item.q }}</span>
              <span class="faq-chevron">{{ faqAberta === i ? '▲' : '▼' }}</span>
            </div>
            <div class="faq-r" v-show="faqAberta === i">{{ item.r }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA FINAL ── -->
    <section class="cta-final">
      <div class="container">
        <h2>Comece agora por apenas R$ 25/mês</h2>
        <p>Sem contrato de fidelidade. Cancele quando quiser.</p>
        <button class="btn-cta" @click="assinar">Assinar o Plano Professional</button>
        <p class="cta-garantia">✅ Pagamento 100% seguro pela Hotmart · 7 dias de garantia</p>
      </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer class="planos-footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span>⚖️</span> Agenda Jurídica
        </div>
        <div class="footer-links">
          <a href="/termos">Termos de Uso</a>
          <a href="/privacidade">Política de Privacidade</a>
          <a href="mailto:suporte@agejur.com.br">suporte@agejur.com.br</a>
        </div>
        <p class="footer-copy">© {{ new Date().getFullYear() }} AgeJur. Todos os direitos reservados.</p>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ── Reset & Base ── */
.planos-page {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #2c3e50;
  background: #fff;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* ── Header ── */
.planos-header {
  background: #1a3a5c;
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
}

.planos-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.planos-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: white;
  font-size: 1.1rem;
}

.planos-logo span { font-size: 1.5rem; }

.btn-header-link {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  border-radius: 8px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}
.btn-header-link:hover { background: rgba(255,255,255,0.25); }

/* ── Hero ── */
.hero {
  background: linear-gradient(135deg, #1a3a5c 0%, #2e5f8a 60%, #1a3a5c 100%);
  padding: 5rem 1.5rem 4rem;
  text-align: center;
  color: white;
}

.hero-inner { max-width: 680px; margin: 0 auto; }

.hero-badge {
  display: inline-block;
  background: rgba(201,168,76,0.25);
  border: 1px solid rgba(201,168,76,0.5);
  color: #f0d080;
  padding: 0.3rem 1rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.25rem;
}

.hero-highlight { color: #c9a84c; }

.hero-sub {
  font-size: 1.1rem;
  opacity: 0.85;
  line-height: 1.7;
  margin-bottom: 2.5rem;
}

.btn-cta {
  background: #c9a84c;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, transform 0.1s;
  box-shadow: 0 4px 20px rgba(201,168,76,0.4);
}
.btn-cta:hover { background: #b8963e; transform: translateY(-1px); }
.btn-cta:active { transform: translateY(0); }

.hero-garantia {
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.7;
}

/* ── Features ── */
.features-section {
  padding: 5rem 1.5rem;
  background: #f5f7fa;
}

.section-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a3a5c;
  margin-bottom: 0.75rem;
}

.section-sub {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 3rem;
}

.feature-card {
  background: white;
  border-radius: 14px;
  padding: 1.75rem 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  border: 1px solid #e0e6ed;
  transition: transform 0.2s, box-shadow 0.2s;
}
.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
.feature-card h3 { font-size: 1rem; font-weight: 700; color: #1a3a5c; margin-bottom: 0.5rem; }
.feature-card p { font-size: 0.875rem; color: #7f8c8d; line-height: 1.6; }

/* ── Pricing ── */
.pricing-section {
  padding: 5rem 1.5rem;
  background: white;
}

.pricing-cards {
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: flex-start;
  margin-top: 3rem;
  flex-wrap: wrap;
}

.pricing-card {
  background: white;
  border: 2px solid #e0e6ed;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  width: 320px;
  text-align: center;
  position: relative;
}

.pricing-card.featured {
  border-color: #c9a84c;
  box-shadow: 0 8px 40px rgba(201,168,76,0.25);
  transform: scale(1.04);
}

.plan-badge-top {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: #c9a84c;
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.3rem 1.2rem;
  border-radius: 999px;
  white-space: nowrap;
}

.plan-name {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.plan-price {
  font-size: 3rem;
  font-weight: 800;
  color: #1a3a5c;
  line-height: 1;
}

.plan-period {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 1.75rem;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  text-align: left;
}

.plan-features li {
  padding: 0.45rem 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #f0f0f0;
}
.plan-features li:last-child { border-bottom: none; }
.plan-features li.ok { color: #2c3e50; }
.plan-features li.no { color: #bdc3c7; }

.btn-plan-outline {
  width: 100%;
  padding: 0.85rem;
  border: 2px solid #1a3a5c;
  border-radius: 10px;
  background: transparent;
  color: #1a3a5c;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}
.btn-plan-outline:hover { background: #f0f4f8; }

.pricing-card.featured .btn-cta { width: 100%; }

.plan-garantia {
  margin-top: 0.85rem;
  font-size: 0.78rem;
  color: #95a5a6;
}

/* ── Social Proof ── */
.proof-section {
  padding: 5rem 1.5rem;
  background: #f5f7fa;
}

.proof-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 3rem;
}

.proof-item {
  background: white;
  border-radius: 14px;
  padding: 1.75rem;
  border: 1px solid #e0e6ed;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.proof-icon { font-size: 1.8rem; margin-bottom: 1rem; }
.proof-item p { font-size: 0.9rem; color: #555; line-height: 1.6; font-style: italic; margin-bottom: 0.75rem; }
.proof-item strong { font-size: 0.82rem; color: #1a3a5c; }

/* ── FAQ ── */
.faq-section {
  padding: 5rem 1.5rem;
  background: white;
}

.faq-container { max-width: 720px; }

.faq-list { margin-top: 2.5rem; }

.faq-item {
  border: 1px solid #e0e6ed;
  border-radius: 10px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.faq-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.faq-item.open { border-color: #c9a84c; }

.faq-q {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a3a5c;
  gap: 1rem;
}

.faq-chevron { color: #c9a84c; flex-shrink: 0; font-size: 0.7rem; }

.faq-r {
  padding: 0 1.25rem 1rem;
  font-size: 0.875rem;
  color: #555;
  line-height: 1.7;
  border-top: 1px solid #f0f0f0;
  padding-top: 0.75rem;
}

/* ── CTA Final ── */
.cta-final {
  background: linear-gradient(135deg, #1a3a5c 0%, #2e5f8a 100%);
  padding: 5rem 1.5rem;
  text-align: center;
  color: white;
}

.cta-final h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.75rem; }
.cta-final p { opacity: 0.8; margin-bottom: 2rem; }
.cta-garantia { margin-top: 1rem; font-size: 0.82rem; opacity: 0.65; }

/* ── Footer ── */
.planos-footer {
  background: #111;
  color: #aaa;
  padding: 2.5rem 1.5rem;
}

.footer-inner { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }

.footer-brand { color: white; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }

.footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; }
.footer-links a { color: #aaa; text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
.footer-links a:hover { color: white; }

.footer-copy { font-size: 0.78rem; margin-top: 0.25rem; }

/* ── Responsivo ── */
@media (max-width: 900px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .proof-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .features-grid { grid-template-columns: 1fr; }
  .proof-grid { grid-template-columns: 1fr; }
  .pricing-card.featured { transform: none; }
  .pricing-cards { flex-direction: column; align-items: center; }
  .hero-title { font-size: 1.75rem; }
}
</style>
