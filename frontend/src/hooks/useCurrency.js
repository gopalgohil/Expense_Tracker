import { useAuth } from '../context/AuthContext'

export const useCurrency = () => {
  const { user } = useAuth()
  const currency = user?.currency || 'INR'

  const currencySymbol = (() => {
    switch (currency) {
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      default:
        return '₹'
    }
  })()

  const currencyLocale = (() => {
    switch (currency) {
      case 'USD':
        return 'en-US'
      case 'EUR':
        return 'en-IE' // English (Ireland) uses Euro, standard formatting
      default:
        return 'en-IN'
    }
  })()

  const formatMoney = (amount, decimals = 2) => {
    const num = Number(amount) || 0
    return `${currencySymbol}${num.toLocaleString(currencyLocale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`
  };

  return {
    currency,
    currencySymbol,
    currencyLocale,
    formatMoney,
  }
}
