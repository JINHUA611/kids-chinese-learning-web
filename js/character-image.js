function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderCharacterImage(image) {
  if (!image?.symbol) return '';

  const alt = escapeHtml(image.alt || '汉字配图');
  return `<figure class="character-image" role="img" aria-label="${alt}">
    <span aria-hidden="true">${escapeHtml(image.symbol)}</span>
    <figcaption>${alt}</figcaption>
  </figure>`;
}
