const { differenceInYears, differenceInMonths, parse } = require('date-fns');

const dateDiff = (dateA, dateB) => {
  if (typeof dateA === 'string') {
    dateA = parse(dateA, 'yyyy-MM', new Date())
  }

  if (typeof dateB === 'string') {
    dateB = dateB === 'Present' ? new Date() : parse(dateB, 'yyyy-MM', new Date())
  }

  let diff = differenceInYears(dateB, dateA)

  if (diff > 1) {
    return `${diff} years`
  }

  if (diff === 1) {
    return `${diff} year`
  }

  diff = differenceInMonths(dateB, dateA)

  if (diff > 1) {
    return `${diff} months`
  }

  return `${diff} month`
}

module.exports = { dateDiff }