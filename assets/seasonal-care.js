/* Homepage enhancement only. Evergreen HTML remains useful without this file. */
(function () {
  'use strict';

  // Marketing priorities, not weather, live availability or profitability claims.
  // Keep all four versions together; tests consume this object without parsing JS text.
  const copy = {
    winter: {
      booking: 'Ask about winter cleanup, brush clearing and plans for spring lawn care.',
      headline: 'Winter yard work,',
      cards: [
        { name: 'Brush & Overgrowth Clearing', description: 'Clear heavy growth along fence lines, banks and overgrown areas, with timing confirmed.', href: '/services/brush-clearing/' },
        { name: 'Bed Preparation & Mulch', description: 'Tidy beds, define edges and refresh mulch, with timing suited to your property.', href: '/services/mulch/' },
        { name: 'Leaf & Yard Cleanup', description: 'Remove lingering leaves and loose yard debris from the areas that need attention.', href: '/services/cleanup/' }
      ],
      planning: 'Planning spring {springYear} lawn care? Share your address so we can discuss route fit and availability.'
    },
    spring: {
      booking: 'Ask about spring cleanup, mulch and recurring mowing for your property.',
      headline: 'Spring cleanup,',
      cards: [
        { name: 'Spring Cleanup', description: 'Clear leaves and loose debris left after winter from your beds and yard.', href: '/services/cleanup/' },
        { name: 'Mulch & Bed Refresh', description: 'Fresh mulch, defined edges and tidy beds, with scope and price confirmed before scheduling.', href: '/services/mulch/' },
        { name: 'Recurring Mowing', description: 'Weekly or every two weeks, with timing confirmed for your property.', href: '/services/mowing/' }
      ],
      planning: 'Planning ongoing lawn care? Share your address so we can discuss route fit and availability.'
    },
    summer: {
      booking: 'Ask about recurring mowing, bed maintenance and cleanup for your property.',
      headline: 'Lawn care,',
      cards: [
        { name: 'Recurring Mowing', description: 'Weekly or every two weeks, with timing confirmed for your property.', href: '/services/mowing/' },
        { name: 'Bed Maintenance', description: 'Keep beds tidy and edges defined as part of ongoing care, with scope confirmed for your yard.', href: '/services/maintenance/' },
        { name: 'Trimming & Cleanup', description: 'String trimming around obstacles, edging along hard surfaces and clearing loose debris.', href: '/services/mowing/' }
      ],
      planning: 'Thinking ahead to fall cleanup? Tell us what your property needs so we can discuss scope and timing.'
    },
    fall: {
      booking: 'Ask about leaf removal, fall cleanup and ongoing care for your property.',
      headline: 'Fall cleanup,',
      cards: [
        { name: 'Leaf Removal', description: 'Clear leaves from your lawn and beds, with the work based on your property and leaf coverage.', href: '/services/cleanup/' },
        { name: 'Bed & Yard Cleanup', description: 'Tidy beds and clear loose yard debris and overgrowth, with the scope confirmed first.', href: '/services/cleanup/' },
        { name: 'Cleanup + Ongoing Care', description: 'Start with a cleanup, then discuss recurring mowing and bed care that fit your property.', href: '/services/maintenance/' }
      ],
      planning: 'Ask about winter projects or spring lawn care. Timing and availability are confirmed separately.'
    }
  };

  function seasonContext(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', year: 'numeric', month: 'numeric'
    }).formatToParts(date);
    const month = Number(parts.find(part => part.type === 'month').value);
    const year = Number(parts.find(part => part.type === 'year').value);
    const season = month === 12 || month <= 2 ? 'winter' : month <= 4 ? 'spring' : month <= 8 ? 'summer' : 'fall';
    return { season, springYear: month >= 9 ? year + 1 : year };
  }

  function enhance(document, date) {
    const context = seasonContext(date);
    const current = copy[context.season];
    const section = document.querySelector('[data-season-care]');
    const lines = document.querySelectorAll('[data-season-line]');
    if (!section || !lines.length) return;
    const headline = section.querySelector('[data-season-headline]');
    const planning = section.querySelector('[data-season-planning]');
    const cards = Array.from(section.querySelectorAll('[data-season-card]'), card => ({
      link: card.querySelector('h3 a'), description: card.querySelector('p')
    }));
    // Resolve every destination before updating anything; retain fallback on incomplete markup.
    if (!headline || !planning || cards.length !== 3 || cards.some(card => !card.link || !card.description)) return;
    lines.forEach(line => { line.textContent = current.booking; });
    headline.textContent = current.headline;
    planning.textContent = current.planning.replace('{springYear}', context.springYear);
    cards.forEach((card, index) => {
      card.link.textContent = current.cards[index].name;
      card.link.setAttribute('href', current.cards[index].href);
      card.description.textContent = current.cards[index].description;
    });
    section.dataset.season = context.season;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { copy, seasonContext, enhance };
  } else {
    // Missing Intl/timezone support must never break the quote form or navigation.
    try { enhance(document, new Date()); } catch (_) { /* Keep evergreen HTML. */ }
  }
})();
