import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatBirthDateInput, getBirthDateParts, getBirthMonthDays, validateBirthDate } from '../src/services/birthDate';
import { BirthDateFields } from '../src/components/onboarding/BirthDateFields';

const maximum = '2027-10-12';

test('continuous numeric typing inserts separators without Tab or native picker', () => {
  let value = '';
  const expected = ['1', '19', '197', '1975/', '1975/1', '1975/11/', '1975/11/1', '1975/11/10'];
  for (const [index, digit] of [...'19751110'].entries()) {
    value = formatBirthDateInput(value + digit, value);
    assert.equal(value, expected[index]);
  }
  assert.equal(validateBirthDate(value, maximum).isoDate, '1975-11-10');
});

test('typing rejects impossible month/day digits and respects leap years', () => {
  for (const [candidate, previous] of [
    ['1975-2', '1975-'], ['1975-13', '1975-1'], ['1975-00', '1975-0'],
    ['1975-11-31', '1975-11-3'], ['1975-01-00', '1975-01-0'],
    ['1975-02-3', '1975-02-'], ['1975-02-29', '1975-02-2'],
    ['2100-02-29', '2100-02-2'],
  ]) assert.equal(formatBirthDateInput(candidate, previous), previous);
  assert.equal(formatBirthDateInput('20000229', ''), '2000/02/29');
  assert.equal(formatBirthDateInput('20240229', ''), '2024/02/29');
  assert.equal(formatBirthDateInput('19751130', ''), '1975/11/30');
  assert.equal(formatBirthDateInput('19751031', ''), '1975/10/31');
});

test('backspace can cross automatically inserted separators and clear the field', () => {
  let value = '1975/11/10';
  const expected = ['1975/11/1', '1975/11/', '1975/1', '1975/', '197', '19', '1', ''];
  for (const next of expected) {
    value = formatBirthDateInput(value.slice(0, -1), value);
    assert.equal(value, next);
  }
  assert.equal(formatBirthDateInput('1975-11-10', ''), '1975/11/10');
  assert.equal(formatBirthDateInput('', '1975-11-10'), '');
});

test('calendar validation rejects malformed dates, zero/overflow fields and impossible dates', () => {
  for (const value of ['1975-00-01', '1975-13-01', '1975-11-00', '1975-11-31', '2001-02-29', '2100-02-29', '1975-01-32', '1975-001-01', '1975-01-01-extra', 'abcd-01-01']) {
    assert.equal(validateBirthDate(value, maximum).isoDate, null, value);
    assert.equal(validateBirthDate(value, maximum).invalid, true, value);
  }
  assert.equal(validateBirthDate('2000-02-29', maximum).isoDate, '2000-02-29');
  assert.equal(validateBirthDate('2024-02-29', maximum).isoDate, '2024-02-29');
  assert.equal(validateBirthDate('1975-1-2', maximum).isoDate, '1975-01-02');
  assert.equal(validateBirthDate('1975/11/10', maximum).isoDate, '1975-11-10');
});

test('incomplete entry gives guidance and both date bounds are inclusive', () => {
  for (const value of ['', '197', '1975-', '1975-11-']) {
    assert.equal(validateBirthDate(value, maximum).isoDate, null);
    assert.equal(validateBirthDate(value, maximum).invalid, false);
  }
  assert.equal(validateBirthDate('1925-01-01', maximum).isoDate, '1925-01-01');
  assert.equal(validateBirthDate(maximum, maximum).isoDate, maximum);
  assert.equal(validateBirthDate('1924-12-31', maximum).isoDate, null);
  assert.equal(validateBirthDate('2027-10-13', maximum).isoDate, null);
  assert.deepEqual(getBirthDateParts('1975-11-'), { year: '1975', month: '11', day: '' });
});

test('inline calendar is initially open with exact month lengths and a year-jump control', () => {
  for (const [year, month, dayCount] of [[2000, 2, 29], [2001, 2, 28], [1975, 11, 30], [1975, 10, 31]]) {
    assert.equal(getBirthMonthDays(year, month), dayCount);
    const value = `${year}-${String(month).padStart(2, '0')}-10`;
    const html = renderToStaticMarkup(React.createElement(BirthDateFields, {
      value, onChange: () => {}, disabled: false, describedBy: 'date-help', invalid: false, maxDate: maximum,
    }));
    assert.match(html, /type="text" inputMode="numeric"/);
    assert.match(html, /placeholder="YYYY\/MM\/DD"/);
    assert.match(html, /autofocus=""/);
    assert.match(html, /aria-describedby="date-help"/);
    assert.match(html, new RegExp(`aria-label="Choose year, currently ${year}"`));
    assert.match(html, /class="first-light__birth-day-grid"/);
    assert.equal((html.match(/aria-pressed="(?:true|false)"/g) ?? []).length, dayCount);
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /type="date"|showPicker/);
  }
});

test('calendar prevents later-than-allowed day selections and disables during submission', () => {
  const props = { value: maximum, onChange: () => {}, disabled: true, describedBy: 'date-help', invalid: true, maxDate: maximum };
  const html = renderToStaticMarkup(React.createElement(BirthDateFields, props));
  assert.match(html, /<fieldset[^>]*disabled=""/);
  assert.match(html, /aria-label="13 Oct 2027"[^>]*disabled=""/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-label="Next month" disabled=""/);
});
