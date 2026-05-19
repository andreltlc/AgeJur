import { computed } from 'vue'

/**
 * Limites do plano gratuito
 * prazos   → máx. de itens PENDENTES (não concluídos)
 * audiencias → máx. de PRÓXIMAS audiências
 */
export const LIMITES_FREE = {
  prazos: 5,
  audiencias: 3,
}

/**
 * usePlan(profile)
 * @param {Ref} profile — ref retornada por useProfile()
 *
 * Retorna:
 *   plan           'free' | 'pro'
 *   isPro          boolean
 *   planStatus     'active' | 'cancelled' | 'refunded' | null
 *   podeAddPrazo   (qtdPendentes: number) => boolean
 *   podeAddAudiencia (qtdProximas: number) => boolean
 *   podeCompartilhar () => boolean
 *   LIMITES_FREE
 */
export function usePlan(profile) {
  const plan       = computed(() => profile.value?.plan       || 'free')
  const isPro      = computed(() => plan.value === 'pro')
  const planStatus = computed(() => profile.value?.planStatus || null)

  function podeAddPrazo(qtdPendentes) {
    if (isPro.value) return true
    return qtdPendentes < LIMITES_FREE.prazos
  }

  function podeAddAudiencia(qtdProximas) {
    if (isPro.value) return true
    return qtdProximas < LIMITES_FREE.audiencias
  }

  function podeCompartilhar() {
    return isPro.value
  }

  return {
    plan,
    isPro,
    planStatus,
    podeAddPrazo,
    podeAddAudiencia,
    podeCompartilhar,
    LIMITES_FREE,
  }
}
