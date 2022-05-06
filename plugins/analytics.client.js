import Plausible from 'plausible-tracker'

export default function ({ app }, inject) {
  const analytics = Plausible({
    domain: 'geidelguerra.com',
    trackLocalhost: true
  })

  analytics.enableAutoPageviews()
  analytics.enableAutoOutboundTracking()

  inject('analytics', analytics)
}
