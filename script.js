// todo 리스트를 저장할 배열
let todos = [];

// DOM 요소 가져오기
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');

// localStorage에서 todos 불러오기
function loadTodos() {
  const saved = localStorage.getItem('todos');
  if (saved) {
    todos = JSON.parse(saved);
  }
}

// todos를 localStorage에 저장
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// todo 리스트 렌더링
function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    const span = document.createElement('span');
    span.className = 'todo-text' + (todo.completed ? ' completed' : '');
    span.textContent = todo.text;
    span.onclick = () => toggleTodo(idx);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = () => deleteTodo(idx);

    li.appendChild(span);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
}

// todo 추가
function addTodo() {
  const text = todoInput.value.trim();
  if (text === '') return;
  todos.push({ text, completed: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

// todo 삭제
function deleteTodo(idx) {
  todos.splice(idx, 1);
  saveTodos();
  renderTodos();
}

// todo 완료 토글
function toggleTodo(idx) {
  todos[idx].completed = !todos[idx].completed;
  saveTodos();
  renderTodos();
}

// 이벤트 리스너 등록
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// 초기화
loadTodos();
renderTodos();
