import { describe, expect, it } from 'vitest'
import { renderLine } from './format'

const nam = { name: 'Minh', gender: 'male' as const }
const nu = { name: 'Lan', gender: 'female' as const }

describe('renderLine', () => {
  it('thay tên và chọn theo giới tính', () => {
    const line = 'Ủa, {name} đó hả? {Thằng|Con nhỏ} này lớn dữ.'
    expect(renderLine(line, nam)).toBe('Ủa, Minh đó hả? Thằng này lớn dữ.')
    expect(renderLine(line, nu)).toBe('Ủa, Lan đó hả? Con nhỏ này lớn dữ.')
  })

  it('một bên có thể để trống', () => {
    expect(renderLine('Chào{| cô bé}.', nu)).toBe('Chào cô bé.')
  })

  it('viết hoa chữ đầu khi chỗ trống đứng đầu câu', () => {
    expect(renderLine('{anh|chị} ơi, bán kẹo', nu)).toBe('Chị ơi, bán kẹo')
  })

  it('câu không có chỗ trống thì giữ nguyên', () => {
    expect(renderLine('(Im lặng, rót cho ông ly nước)', nam)).toBe('(Im lặng, rót cho ông ly nước)')
  })

  it('chưa có hồ sơ thì không vỡ chữ', () => {
    expect(renderLine('{name} ơi, {anh|chị}', null)).toBe('Cháu ơi, anh')
  })
})
