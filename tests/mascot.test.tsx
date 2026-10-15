import React from 'react';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { NatallyAvatar } from '../src/components/NatallyAvatar';
import { NatallyIcon } from '../src/components/NatallyIcon';

test('official animated mascot is the default portrait', () => {
  const markup = renderToStaticMarkup(<NatallyAvatar />);
  assert.match(markup, /src="\/natally-mascot.webp"/);
  assert.match(markup, /alt="Natally Mascot"/);
});

test('custom portrait keeps precedence over the default', () => {
  const markup = renderToStaticMarkup(<NatallyAvatar avatarUrl="/custom.webp" />);
  assert.match(markup, /src="\/custom.webp"/);
  assert.doesNotMatch(markup, /src="\/natally-mascot.webp"/);
});

test('disabled animation renders the existing static vector fallback', () => {
  const markup = renderToStaticMarkup(<NatallyAvatar isAnimated={false} />);
  assert.match(markup, /<svg/);
  assert.doesNotMatch(markup, /animate-spin|animate-pulse|src="\/natally-mascot.webp"/);
});

test('header portrait is larger without enlarging ordinary small icons', () => {
  assert.match(renderToStaticMarkup(<NatallyIcon size="header" />), /width:72px;height:72px/);
  assert.match(renderToStaticMarkup(<NatallyIcon size="sm" />), /width:36px;height:36px/);
});

test('favicon references the shipped original animated WebP', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const asset = readFileSync(new URL('../public/natally-mascot.webp', import.meta.url));
  assert.match(html, /rel="icon" type="image\/webp" href="\/natally-mascot.webp"/);
  assert.equal(asset.toString('ascii', 8, 12), 'WEBP');
  assert.ok(asset.includes(Buffer.from('ANIM')));
});
