export function getDeliveryWindow(referenceDate: Date): string {
  const refYear = referenceDate.getFullYear()

  const start = new Date(referenceDate)
  start.setDate(start.getDate() + 56)

  const end = new Date(referenceDate)
  end.setDate(end.getDate() + 84)

  const format = (date: Date): string => {
    const day = date.getDate()
    const month = date.toLocaleDateString('nl-NL', { month: 'short' })
    const year = date.getFullYear()
    return year !== refYear ? `${day}. ${month} ${year}` : `${day}. ${month}`
  }

  return `${format(start)} – ${format(end)}`
}
