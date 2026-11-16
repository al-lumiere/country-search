import { createSearchController } from './search/createSearchController.js';
import { createSearchView } from './ui/createSearchView.js';

const view = createSearchView();
const controller = createSearchController(view.render);

view.input.addEventListener('input', () => {
  controller.setQuery(view.input.value);
});

view.retryButton.addEventListener('click', () => {
  controller.retry();
});

view.render(controller.getState());
document.body.append(view.element);
