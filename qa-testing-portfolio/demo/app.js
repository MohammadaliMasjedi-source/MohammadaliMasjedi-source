'use strict';
const $ = (selector) => document.querySelector(selector);
const list = $('#tasks');
const message = $('#message');
let refreshCounter = 0;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) {
    let detail = 'Request failed';
    try { detail = (await response.json()).error || detail; } catch (_) { /* no body */ }
    throw new Error(detail);
  }
  return response.status === 204 ? null : response.json();
}

function makeButton(text, action, label, cssClass = 'small') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.className = cssClass;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', action);
  return button;
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = 'task';
  const info = document.createElement('div');
  info.className = 'task-info';
  const title = document.createElement('p');
  title.className = 'task-title' + (task.status === 'completed' ? ' done' : '');
  title.textContent = task.title; // textContent prevents HTML injection.
  const meta = document.createElement('span');
  meta.className = 'meta';
  meta.textContent = `${task.status} · ${task.priority} priority · #${task.id}`;
  info.append(title, meta);
  const actions = document.createElement('div');
  actions.className = 'task-actions';
  const toggle = makeButton(task.status === 'completed' ? 'Reopen' : 'Complete', async () => {
    try {
      await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'completed' ? 'pending' : 'completed' }) });
      showMessage('Task updated.');
      await loadTasks();
    } catch (error) { showMessage(error.message, true); }
  }, `${task.status === 'completed' ? 'Reopen' : 'Complete'} ${task.title}`);
  const remove = makeButton('Delete', async () => {
    try {
      await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
      showMessage('Task deleted.');
      await loadTasks();
    } catch (error) { showMessage(error.message, true); }
  }, `Delete ${task.title}`, 'small danger');
  actions.append(toggle, remove);
  li.append(info, actions);
  return li;
}

async function loadTasks() {
  const requestId = ++refreshCounter;
  const params = new URLSearchParams({ status: $('#status').value, q: $('#search').value });
  try {
    const data = await api(`/api/tasks?${params}`);
    if (requestId !== refreshCounter) return;
    list.replaceChildren(...data.tasks.map(renderTask));
    if (!data.tasks.length) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'No tasks match your filters.';
      list.append(empty);
    }
    $('#count').textContent = data.count;
  } catch (error) { showMessage(error.message, true); }
}

$('#task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title: $('#title').value, priority: $('#priority').value }) });
    $('#task-form').reset();
    showMessage('Task created.');
    await loadTasks();
    $('#title').focus();
  } catch (error) { showMessage(error.message, true); }
});
$('#status').addEventListener('change', loadTasks);
$('#search').addEventListener('input', loadTasks);
$('#reset').addEventListener('click', async () => {
  try {
    await api('/api/reset', { method: 'POST', body: '{}' });
    $('#status').value = 'all';
    $('#search').value = '';
    showMessage('Demo data reset.');
    await loadTasks();
  } catch (error) { showMessage(error.message, true); }
});
loadTasks();
