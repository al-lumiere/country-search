import type { Country } from '../countries/types.js';

export function createCountryDetails() {
  const dialog = document.createElement('dialog');
  dialog.className = 'country-dialog';
  dialog.setAttribute('aria-labelledby', 'country-details-title');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'dialog-close';
  closeButton.textContent = 'Закрыть';
  closeButton.autofocus = true;
  closeButton.addEventListener('click', () => dialog.close());

  const title = document.createElement('h2');
  title.id = 'country-details-title';

  const description = document.createElement('p');
  description.className = 'country-description';

  const details = document.createElement('dl');

  dialog.append(closeButton, title, description, details);

  function open(country: Country) {
    const formatNumber = new Intl.NumberFormat('ru-RU');

    title.textContent = country.name;
    description.textContent =
      `${country.name}. Регион: ${country.region}. ` +
      `Столица: ${country.capital || 'не указана'}.`;

    const rows: [string, string][] = [
      ['Население', formatNumber.format(country.population)],
      [
        'Площадь',
        country.area === null
          ? 'Не указана'
          : `${formatNumber.format(country.area)} км²`,
      ],
      ['Языки', country.languages.join(', ') || 'Не указаны'],
      ['Валюты', country.currencies.join(', ') || 'Не указаны'],
      ['Границы (ISO-коды)', country.borders.join(', ') || 'Не указаны'],
    ];

    details.replaceChildren(
      ...rows.flatMap(([label, value]) => {
        const term = document.createElement('dt');
        term.textContent = label;

        const definition = document.createElement('dd');
        definition.textContent = value;

        return [term, definition];
      }),
    );

    if (!dialog.open) {
      dialog.showModal();
    }
  }

  return { element: dialog, open };
}
