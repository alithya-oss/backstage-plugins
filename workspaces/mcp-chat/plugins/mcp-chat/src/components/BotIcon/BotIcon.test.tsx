/*
 * Copyright 2026 The Alithya Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { render } from '@testing-library/react';
import { BotIcon, BotIconComponent } from './BotIcon';

describe('BotIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<BotIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });

  it('applies default size of 30', () => {
    const { container } = render(<BotIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '30');
    expect(svg).toHaveAttribute('height', '30');
  });

  it('applies custom size', () => {
    const { container } = render(<BotIcon size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('applies default color of #333', () => {
    const { container } = render(<BotIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#333');
  });

  it('applies custom color', () => {
    const { container } = render(<BotIcon color="#ff0000" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#ff0000');
  });

  it('contains path and rect elements forming the icon', () => {
    const { container } = render(<BotIcon />);
    const paths = container.querySelectorAll('path');
    const rects = container.querySelectorAll('rect');
    expect(paths.length).toBeGreaterThan(0);
    expect(rects.length).toBe(2);
  });

  it('renders with the correct viewBox', () => {
    const { container } = render(<BotIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
  });
});

describe('BotIconComponent', () => {
  it('renders an SVG element as Backstage IconComponent', () => {
    const { container } = render(<BotIconComponent />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('maps medium fontSize to size 24', () => {
    const { container } = render(<BotIconComponent fontSize="medium" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('maps small fontSize to size 20', () => {
    const { container } = render(<BotIconComponent fontSize="small" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('maps large fontSize to size 35', () => {
    const { container } = render(<BotIconComponent fontSize="large" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '35');
    expect(svg).toHaveAttribute('height', '35');
  });

  it('defaults to inherit color as #B5B5B5', () => {
    const { container } = render(<BotIconComponent />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#B5B5B5');
  });
});
