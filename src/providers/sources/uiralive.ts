import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

// thanks uira for this api!
const baseUrl = 'https://xj4h5qk3tf7v2mlr9s.uira.live/';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const fetchUrl = `${baseUrl}all/${ctx.media.tmdbId}${
    ctx.media.type === 'movie' ? '' : `?s=${ctx.media.season.number}&e=${ctx.media.episode.number}`
  }`;

  try {
    let result = await ctx.fetcher(fetchUrl);

    if (!result?.sources || result.sources.length === 0) {
      // Retry once if no sources found
      result = await ctx.fetcher(fetchUrl);
    }

    if (!result?.sources?.[0]?.url) {
      throw new NotFoundError('No valid sources found');
    }

    ctx.progress(90);

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          playlist: result.sources[0].url,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
          captions: result.captions || [],
        },
      ],
    };
  } catch (e: any) {
    if (e instanceof NotFoundError) {
      throw new NotFoundError(`uiralive: ${e.message}`);
    }
    throw e;
  }
}

export const uiraliveScraper = makeSourcerer({
  id: 'uiralive',
  name: 'Uira',
  rank: 940,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
