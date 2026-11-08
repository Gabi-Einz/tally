import { describe, expect, it } from 'vitest'
import { parseExpenseEn } from './parseEn'
import { parseExpenseEs } from './parseEs'

const TODAY = '2026-11-08'
const amountOf = (text: string) => parseExpenseEn(text, TODAY).amount

describe('English amounts in words', () => {
  it.each([
    ['five', 5],
    ['eleven', 11],
    ['twenty three', 23],
    ['twenty-three', 23],
    ['ninety nine', 99],
    ['a hundred', 100],
    ['one hundred', 100],
    ['two hundred fifty', 250],
    ['two hundred and fifty', 250],
    ['nine hundred ninety nine', 999],
    ['a thousand', 1000],
    ['one thousand five hundred', 1500],
    ['two thousand three hundred', 2300],
    ['twenty three thousand', 23000],
    ['eighty five thousand', 85000],
    ['one hundred twenty thousand', 120000],
    ['a million', 1000000],
    ['one million two hundred thousand', 1200000],
    ['five grand', 5000],
    ['15 thousand', 15000],
  ])('"%s" → %s', (text, value) => {
    expect(amountOf(`I spent ${text} at the store`)).toBe(value * 100)
  })
})

describe('English amounts in digits', () => {
  it.each([
    ['2300', 2300],
    ['2,300', 2300],
    ['23,000.50', 23000.5],
    ['$5,000', 5000],
    ['2300.5', 2300.5],
    ['2k', 2000],
    ['2.5k', 2500],
    ['1,234,567', 1234567],
  ])('"%s" → %s', (text, value) => {
    expect(amountOf(`paid ${text} for electricity`)).toBe(
      Math.round(value * 100),
    )
  })
})

describe('English dates', () => {
  it.each([
    ['I spent 500 today at the kiosk', '2026-11-08'],
    ['yesterday I spent 500 at the kiosk', '2026-11-07'],
    ['the day before yesterday I paid 500 for a taxi', '2026-11-06'],
    ['on monday I spent 500 at the supermarket', '2026-11-02'],
    ['last saturday I paid 500 for the movies', '2026-11-07'],
    ['sunday 500 for groceries', '2026-11-01'],
    ['on the 3rd I paid 500 for electricity', '2026-11-03'],
    ['on the 15th I paid 500 for electricity', '2026-10-15'],
    ['on october 3 I paid 500 for electricity', '2026-10-03'],
    ['on october 3rd I paid 500 for electricity', '2026-10-03'],
    ['on the 20th of december I spent 500 on gifts', '2025-12-20'],
    ['I spent 500 at the supermarket', '2026-11-08'],
  ])('"%s" → %s', (text, date) => {
    expect(parseExpenseEn(text, TODAY).date).toBe(date)
  })
})

describe('English full phrases', () => {
  it.each([
    ['I spent 1500 on the bus yesterday', 1500, 'ARS', '2026-11-07', 'Bus'],
    [
      'I paid 31,500 for electricity',
      31500,
      'ARS',
      '2026-11-08',
      'Electricity',
    ],
    ['yesterday 14 thousand on Rappi', 14000, 'ARS', '2026-11-07', 'Rappi'],
    [
      'I bought sneakers for 85 thousand',
      85000,
      'ARS',
      '2026-11-08',
      'Sneakers',
    ],
    ['8000 for gas at YPF', 8000, 'ARS', '2026-11-08', 'Gas at YPF'],
    ['coffee 600', 600, 'ARS', '2026-11-08', 'Coffee'],
    ['I spent 23 thousand pesos at Coto', 23000, 'ARS', '2026-11-08', 'Coto'],
    ['I spent 20 dollars on Spotify', 20, 'USD', '2026-11-08', 'Spotify'],
    ['Netflix 15 bucks', 15, 'USD', '2026-11-08', 'Netflix'],
    ['I paid USD 30 for a course', 30, 'USD', '2026-11-08', 'Course'],
    ['I paid US$45 for the hotel', 45, 'USD', '2026-11-08', 'Hotel'],
    [
      'on monday I spent two thousand three hundred at the pharmacy',
      2300,
      'ARS',
      '2026-11-02',
      'Pharmacy',
    ],
    [
      'lunch with friends 12 thousand',
      12000,
      'ARS',
      '2026-11-08',
      'Lunch with friends',
    ],
    ['I paid 4500 for a haircut', 4500, 'ARS', '2026-11-08', 'Haircut'],
    [
      'I spent 7 thousand on vegetables',
      7000,
      'ARS',
      '2026-11-08',
      'Vegetables',
    ],
    ['rent 350 thousand', 350000, 'ARS', '2026-11-08', 'Rent'],
    [
      'I spent 900 at the kiosk the day before yesterday',
      900,
      'ARS',
      '2026-11-06',
      'Kiosk',
    ],
    ['Uber 3200 yesterday', 3200, 'ARS', '2026-11-07', 'Uber'],
    ['I spent 18 thousand at the vet', 18000, 'ARS', '2026-11-08', 'Vet'],
    [
      'a gift for my nephew 20 thousand',
      20000,
      'ARS',
      '2026-11-08',
      'Gift for my nephew',
    ],
  ])('"%s"', (text, value, currency, date, description) => {
    expect(parseExpenseEn(text, TODAY)).toEqual({
      amount: Math.round(value * 100),
      currency,
      date,
      description,
    })
  })
})

describe('dólares dictados en español', () => {
  it.each([
    ['gasté 20 dólares en Spotify', 20, 'Spotify'],
    ['pagué 50 dólares de hotel', 50, 'Hotel'],
    ['gasté 100 verdes en ropa', 100, 'Ropa'],
    ['pagué USD 30 por un curso', 30, 'Curso'],
    ['pagué U$S 45 de Netflix', 45, 'Netflix'],
    ['US$12 en Steam', 12, 'Steam'],
    ['gasté 20 en dólares en el free shop', 20, 'Free shop'],
    ['gasté veinte dólares en Amazon', 20, 'Amazon'],
  ])('"%s" → US$ %s', (text, value, description) => {
    expect(parseExpenseEs(text, TODAY)).toMatchObject({
      amount: value * 100,
      currency: 'USD',
      description,
    })
  })

  it('sin mencionar dólares es en pesos', () => {
    expect(parseExpenseEs('gasté 20 mil en ropa', TODAY).currency).toBe('ARS')
    expect(parseExpenseEs('gasté 20 mil pesos en ropa', TODAY).currency).toBe(
      'ARS',
    )
  })
})

describe('more English phrases', () => {
  it.each([
    ['I spent 2500 on coffee', 2500, 'Coffee'],
    ['paid 45 thousand for health insurance', 45000, 'Health insurance'],
    ['I spent 3200 at the Chinese market', 3200, 'Chinese market'],
    ['groceries 18 thousand', 18000, 'Groceries'],
    ['I paid 9500 at the dentist', 9500, 'Dentist'],
    ['subway 1200', 1200, 'Subway'],
    ['I spent 6000 at the cinema', 6000, 'Cinema'],
    ['pizza 9000', 9000, 'Pizza'],
    ['I paid 25 thousand for internet', 25000, 'Internet'],
    ['I paid 2 thousand for parking', 2000, 'Parking'],
    ['books 30 thousand', 30000, 'Books'],
    ['I spent twelve thousand on PedidosYa', 12000, 'PedidosYa'],
    ['toll 4 thousand', 4000, 'Toll'],
    ['I spent 600 on a coffee', 600, 'Coffee'],
    ['I paid 80 thousand for rent', 80000, 'Rent'],
    ['water bill 3500', 3500, 'Water bill'],
    ['I spent 16 thousand at the bar', 16000, 'Bar'],
    ['taxi 5500', 5500, 'Taxi'],
    ['dinner 40 thousand', 40000, 'Dinner'],
    ['I bought a jacket for 120 thousand', 120000, 'Jacket'],
    ['I paid 3999 for Spotify', 3999, 'Spotify'],
    ['I spent 1,250,000 on a fridge', 1250000, 'Fridge'],
    ['gym membership 28 thousand', 28000, 'Gym membership'],
    ['I spent 7500 on medicine', 7500, 'Medicine'],
    ['dog food 15 thousand', 15000, 'Dog food'],
    ['I spent 3 thousand at the bakery', 3000, 'Bakery'],
    ['electricity bill 31,500', 31500, 'Electricity bill'],
    ['I paid 50 thousand for the course', 50000, 'Course'],
    ['train ticket 900', 900, 'Train ticket'],
    ['I spent 11 thousand on clothes', 11000, 'Clothes'],
    ['phone bill 14 thousand', 14000, 'Phone bill'],
    ['I paid 2300 at the pharmacy', 2300, 'Pharmacy'],
    ['concert tickets 60 thousand', 60000, 'Concert tickets'],
    ['I spent five hundred on candy', 500, 'Candy'],
    ['I paid nine thousand for a haircut', 9000, 'Haircut'],
    ['ice cream 4200', 4200, 'Ice cream'],
    ['I spent 35 thousand at the supermarket', 35000, 'Supermarket'],
    ['vet visit 22 thousand', 22000, 'Vet visit'],
    ['I paid 1800 for the bus', 1800, 'Bus'],
    ['birthday present 25 thousand', 25000, 'Birthday present'],
  ])('"%s"', (text, value, description) => {
    expect(parseExpenseEn(text, TODAY)).toEqual({
      amount: value * 100,
      currency: 'ARS',
      date: TODAY,
      description,
    })
  })
})
