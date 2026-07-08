import { describe, expect, it } from '@jest/globals';

import { parseYouTubeId, stripLeadingYouTubeEmbed } from '@/presentation/lib/video';

describe('parseYouTubeId', () => {
  it('extracts ids from common YouTube URL shapes', () => {
    expect(parseYouTubeId('https://youtu.be/0y7DR_ZJsRw')).toBe('0y7DR_ZJsRw');
    expect(parseYouTubeId('https://www.youtube.com/watch?v=0y7DR_ZJsRw&t=2s')).toBe('0y7DR_ZJsRw');
    expect(parseYouTubeId('https://www.youtube.com/embed/0y7DR_ZJsRw')).toBe('0y7DR_ZJsRw');
    expect(parseYouTubeId('https://www.youtube.com/shorts/0y7DR_ZJsRw')).toBe('0y7DR_ZJsRw');
  });
});

describe('stripLeadingYouTubeEmbed', () => {
  it('removes a leading WordPress YouTube embed figure', () => {
    const html = `
<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube"><div class="wp-block-embed__wrapper">
https://youtu.be/0y7DR_ZJsRw
</div></figure>

<p>The transcript starts here.</p>`;

    expect(stripLeadingYouTubeEmbed(html, 'https://youtu.be/0y7DR_ZJsRw')).toBe(
      '<p>The transcript starts here.</p>',
    );
  });

  it('keeps non-leading YouTube embeds in the body', () => {
    const html = '<p>Intro</p><figure><div>https://youtu.be/0y7DR_ZJsRw</div></figure>';

    expect(stripLeadingYouTubeEmbed(html, 'https://youtu.be/0y7DR_ZJsRw')).toBe(html);
  });

  it('keeps a leading figure when it is a different expected video', () => {
    const html = '<figure><div>https://youtu.be/0y7DR_ZJsRw</div></figure><p>Body</p>';

    expect(stripLeadingYouTubeEmbed(html, 'https://youtu.be/AAAAAAAAAAA')).toBe(html);
  });
});
