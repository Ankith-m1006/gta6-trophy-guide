// A tiny element builder: el('div.card', { onclick }, child, 'text').
export function el(spec, props, ...children) {
  const [tag, ...classes] = spec.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
    children.unshift(props);
    props = null;
  }
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'html') node.innerHTML = value;
    else if (key in node && key !== 'list') node[key] = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  appendAll(node, children);
  return node;
}

function appendAll(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : String(child));
  }
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toast.hidden = true), 3200);
}

const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };

// A small trophy cup drawn in SVG, coloured by grade in CSS.
export function gradeIcon(grade) {
  const wrap = el(`span.grade-icon.g-${grade}`, { title: grade, 'aria-label': `${grade} trophy` });
  wrap.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v3h3v2a5 5 0 0 1-4.6 5A5 5 0 0 1 13 15.6V18h3v3H8v-3h3v-2.4A5 5 0 0 1 8.6 13 5 5 0 0 1 4 8V6h3zm0 5V8H6a3 3 0 0 0 1.1 2.2A6 6 0 0 1 7 8m10 0a6 6 0 0 1-.1 2.2A3 3 0 0 0 18 8z"/></svg>';
  wrap.append(el('b', GRADE_LETTER[grade]));
  return wrap;
}
