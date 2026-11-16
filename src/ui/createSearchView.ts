import type { Country } from '../countries/types.js';
import type { SearchState } from '../search/createSearchController.js';
import { createCountryDetails } from './createCountryDetails.js';

function createCountryCard(
  country: Country,
  onSelect: (country: Country) => void,
): HTMLLIElement {
  const card = document.createElement('li');
  card.className = 'country-card';

  const flag = document.createElement('span');
  flag.className = 'country-flag';

  if (/^https?:\/\//.test(country.flag)) {
    const image = document.createElement('img');
    image.src = country.flag;
    image.alt = `Флаг страны ${country.name}`;
    image.loading = 'lazy';
    flag.append(image);
  } else {
    flag.textContent = country.flag;
  }

  const name = document.createElement('h2');
  name.textContent = country.name;

  const capital = document.createElement('p');
  capital.textContent = `Столица: ${country.capital || 'не указана'}`;

  const region = document.createElement('p');
  region.textContent = `Регион: ${country.region}`;

  const population = document.createElement('p');
  population.textContent = `Население: ${new Intl.NumberFormat('ru-RU').format(country.population)}`;

  const detailsButton = document.createElement('button');
  detailsButton.type = 'button';
  detailsButton.className = 'details-button';
  detailsButton.textContent = 'Подробнее';
  detailsButton.setAttribute(
    'aria-label',
    `Подробнее о стране ${country.name}`,
  );
  detailsButton.addEventListener('click', () => onSelect(country));

  card.append(flag, name, capital, region, population, detailsButton);

  return card;
}

export function createSearchView() {
  const details = createCountryDetails();

  const element = document.createElement('main');
  element.className = 'page';

  const title = document.createElement('h1');
  title.textContent = 'Country Search';

  const label = document.createElement('label');
  label.htmlFor = 'country-search';
  label.textContent = 'Какую страну ищем?';

  const input = document.createElement('input');
  input.id = 'country-search';
  input.type = 'search';
  input.placeholder = 'Например, Spain';
  input.autocomplete = 'off';
  input.spellcheck = false;

  const message = document.createElement('p');
  message.className = 'status';
  message.setAttribute('role', 'status');

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.className = 'retry-button';
  retryButton.textContent = 'Повторить';

  const list = document.createElement('ul');
  list.className = 'countries';

  element.append(
    title,
    label,
    input,
    message,
    retryButton,
    list,
    details.element,
  );

  function render(state: SearchState) {
    const messages: Record<SearchState['status'], string> = {
      idle: 'Введите название страны на английском.',
      waiting: 'Ждём окончания ввода…',
      loading: 'Ищем страны…',
      success: `Найдено стран: ${state.countries.length}`,
      empty: 'Ничего не найдено. Попробуйте другое название.',
      error: state.errorMessage ?? 'Не удалось загрузить страны.',
    };

    message.textContent = messages[state.status];
    message.dataset.status = state.status;
    retryButton.hidden = state.status !== 'error';

    list.setAttribute('aria-busy', String(state.status === 'loading'));
    list.replaceChildren(
      ...state.countries.map((country) =>
        createCountryCard(country, details.open),
      ),
    );
  }

  return { element, input, retryButton, render };
}
