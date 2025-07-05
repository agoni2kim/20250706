// todo 리스트를 저장할 배열
let todos = [];

// DOM 요소 가져오기
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const exportBtn = document.getElementById('export-btn');
const paginationButtons = document.getElementById('pagination-buttons');
const monthlyExportCheckbox = document.getElementById('monthly-export');

// 달력 관련 DOM 요소
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthText = document.getElementById('current-month');
const calendarDays = document.getElementById('calendar-days');
const selectedDateText = document.getElementById('selected-date-text');
const showAllBtn = document.getElementById('show-all-btn');

// 페이지네이션 변수
let currentPage = 1;
const itemsPerPage = 5;

// 달력 변수
let currentCalendarDate = new Date();
let selectedDate = new Date(); // 초기값을 오늘 날짜로 설정

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

// 페이지네이션 계산 (단순 5개씩)
function getPaginatedTodos() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return todos.slice(startIndex, endIndex);
}

// 페이지네이션 버튼 렌더링
function renderPagination() {
  const totalPages = Math.ceil(todos.length / itemsPerPage);
  
  console.log('Total todos:', todos.length, 'Total pages:', totalPages, 'Current page:', currentPage); // 디버깅용
  
  paginationButtons.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement('button');
    button.className = `page-btn ${i === currentPage ? 'active' : ''}`;
    button.textContent = i;
    button.onclick = () => {
      currentPage = i;
      renderTodos();
    };
    paginationButtons.appendChild(button);
  }
}

// todo 리스트 렌더링 (단순 5개씩)
function renderTodos() {
  todoList.innerHTML = '';
  const paginatedTodos = getPaginatedTodos();
  
  paginatedTodos.forEach((todo, idx) => {
    const actualIndex = (currentPage - 1) * itemsPerPage + idx;
    const li = document.createElement('li');
    li.className = 'todo-item';

    const span = document.createElement('span');
    span.className = 'todo-text' + (todo.completed ? ' completed' : '');
    span.textContent = todo.text;
    span.onclick = () => toggleTodo(actualIndex);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = () => deleteTodo(actualIndex);

    li.appendChild(span);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
  
  renderPagination();
}

// 오늘 날짜를 YY.MM.DD 형식으로 가져오기
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2); // 뒤 2자리만
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 0으로 패딩
  const day = String(today.getDate()).padStart(2, '0'); // 0으로 패딩
  return `${year}.${month}.${day}`;
}

// 선택된 담당수의사 가져오기
function getSelectedDoctor() {
  const selectedDoctor = document.querySelector('input[name="doctor"]:checked');
  return selectedDoctor ? selectedDoctor.value : '';
}

// 선택된 날짜를 YY.MM.DD 형식으로 가져오기
function getSelectedDateFormatted() {
  return `${selectedDate.getFullYear().toString().slice(-2)}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${String(selectedDate.getDate()).padStart(2, '0')}`;
}

// todo 추가
function addTodo() {
  const text = todoInput.value.trim();
  if (text === '') return;
  
  const selectedDateFormatted = getSelectedDateFormatted();
  const selectedDoctor = getSelectedDoctor();
  const displayText = selectedDoctor ? `${selectedDateFormatted}, ${selectedDoctor}, ${text}` : `${selectedDateFormatted}, ${text}`;
  
  todos.push({ text: displayText, completed: false });
  saveTodos();
  
  // 새로운 항목이 추가되면 첫 번째 페이지로 이동
  currentPage = 1;
  
  // 추가 후 해당 날짜의 데이터만 필터링해서 표시
  filterTodosByDate(selectedDate);
  todoInput.value = '';
  todoInput.focus();
}

// todo 삭제
function deleteTodo(idx) {
  todos.splice(idx, 1);
  saveTodos();
  
  // 현재 페이지의 마지막 항목을 삭제했을 때 이전 페이지로 이동
  const totalPages = Math.ceil(todos.length / itemsPerPage);
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  
  renderTodos();
}

// todo 완료 토글
function toggleTodo(idx) {
  todos[idx].completed = !todos[idx].completed;
  saveTodos();
  renderTodos();
}

// 엑셀 파일 다운로드
function exportToExcel() {
  if (todos.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }

  // CSV 헤더
  const headers = ['순서', '날짜', '담당수의사', '백신접종 개체'];
  
  let csvData;
  
  // 월별 체크박스가 체크되어 있는지 확인
  if (monthlyExportCheckbox.checked) {
    // 현재 달력에 표시된 달의 데이터만 필터링
    const currentYear = currentCalendarDate.getFullYear();
    const currentMonth = currentCalendarDate.getMonth() + 1;
    
    csvData = todos.filter(todo => {
      const parts = todo.text.split(', ');
      const date = parts[0] || '';
      const dateParts = date.split('.');
      if (dateParts.length >= 2) {
        const todoYear = parseInt('20' + dateParts[0]); // YY.MM.DD 형식에서 연도 추출
        const todoMonth = parseInt(dateParts[1]);
        return todoYear === currentYear && todoMonth === currentMonth;
      }
      return false;
    }).sort((a, b) => {
      // 날짜순으로 정렬 (빠른 날짜가 먼저)
      const partsA = a.text.split(', ');
      const partsB = b.text.split(', ');
      const dateA = partsA[0] || '';
      const dateB = partsB[0] || '';
      
      // YY.MM.DD 형식을 Date 객체로 변환하여 비교
      const datePartsA = dateA.split('.');
      const datePartsB = dateB.split('.');
      
      if (datePartsA.length >= 3 && datePartsB.length >= 3) {
        const yearA = parseInt('20' + datePartsA[0]);
        const monthA = parseInt(datePartsA[1]);
        const dayA = parseInt(datePartsA[2]);
        
        const yearB = parseInt('20' + datePartsB[0]);
        const monthB = parseInt(datePartsB[1]);
        const dayB = parseInt(datePartsB[2]);
        
        const dateObjA = new Date(yearA, monthA - 1, dayA);
        const dateObjB = new Date(yearB, monthB - 1, dayB);
        
        return dateObjA - dateObjB;
      }
      
      return 0;
    }).map((todo, index) => {
      const parts = todo.text.split(', ');
      const date = parts[0] || '';
      const doctor = parts[1] || '';
      const animal = parts[2] || '';
      
      return [index + 1, date, doctor, animal];
    });
    
    if (csvData.length === 0) {
      alert('현재 달에 데이터가 없습니다.');
      return;
    }
  } else {
    // 선택된 날짜의 데이터만 필터링
    if (!selectedDate) {
      alert('달력에서 날짜를 선택해주세요.');
      return;
    }
    
    const selectedDateStr = `${selectedDate.getFullYear().toString().slice(-2)}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    csvData = todos.filter(todo => {
      const parts = todo.text.split(', ');
      const date = parts[0] || '';
      return date === selectedDateStr;
    }).sort((a, b) => {
      // 같은 날짜 내에서는 담당수의사 순으로 정렬
      const partsA = a.text.split(', ');
      const partsB = b.text.split(', ');
      const doctorA = partsA[1] || '';
      const doctorB = partsB[1] || '';
      
      return doctorA.localeCompare(doctorB);
    }).map((todo, index) => {
      const parts = todo.text.split(', ');
      const date = parts[0] || '';
      const doctor = parts[1] || '';
      const animal = parts[2] || '';
      
      return [index + 1, date, doctor, animal];
    });
    
    if (csvData.length === 0) {
      alert('선택된 날짜에 데이터가 없습니다.');
      return;
    }
  }

  // CSV 문자열 생성
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');

  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 파일명 생성
  let fileName;
  if (monthlyExportCheckbox.checked) {
    const currentYear = currentCalendarDate.getFullYear();
    const currentMonth = currentCalendarDate.getMonth() + 1;
    fileName = `백신접종_데이터_${currentYear}년${currentMonth}월.csv`;
  } else {
    const selectedDateStr = `${selectedDate.getFullYear().toString().slice(-2)}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${String(selectedDate.getDate()).padStart(2, '0')}`;
    fileName = `백신접종_데이터_${selectedDateStr}.csv`;
  }
  
  // 파일 다운로드
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 이벤트 리스너 등록
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});
exportBtn.addEventListener('click', exportToExcel);

// 달력 이벤트 리스너
prevMonthBtn.addEventListener('click', prevMonth);
nextMonthBtn.addEventListener('click', nextMonth);
showAllBtn.addEventListener('click', showAllData);

// 달력 렌더링
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // 월 표시 업데이트
  currentMonthText.textContent = `${year}년 ${month + 1}월`;
  
  // 달력 그리드 생성
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  calendarDays.innerHTML = '';
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // 현재 달의 날짜만 표시
    if (date.getMonth() === month) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      
      // 일요일인지 확인 (0 = 일요일)
      if (date.getDay() === 0) {
        dayElement.classList.add('sunday');
      }
      
      // 토요일인지 확인 (6 = 토요일)
      if (date.getDay() === 6) {
        dayElement.classList.add('saturday');
      }
      
      // 선택된 날짜인지 확인
      if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        dayElement.classList.add('selected');
      } else {
        // 선택된 날짜가 없을 때만 오늘 날짜 표시
        const today = new Date();
        if (date.toDateString() === today.toDateString() && !selectedDate) {
          dayElement.classList.add('today');
        }
      }
      
      dayElement.textContent = date.getDate();
      dayElement.onclick = () => selectDate(date);
      
      calendarDays.appendChild(dayElement);
    } else {
      // 다른 달의 날짜는 빈 칸으로 표시
      const emptyElement = document.createElement('div');
      emptyElement.className = 'calendar-day empty';
      calendarDays.appendChild(emptyElement);
    }
  }
}

// 날짜 선택
function selectDate(date) {
  selectedDate = date;
  currentPage = 1; // 첫 번째 페이지로 리셋
  selectedDateText.textContent = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  renderCalendar();
  
  // 선택된 날짜의 데이터만 필터링해서 표시
  filterTodosByDate(date);
}

// 오늘 날짜인지 확인하는 함수
function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// 이전 달로 이동
function prevMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
}

// 다음 달로 이동
function nextMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
}

// 선택된 날짜의 데이터만 필터링해서 표시
function filterTodosByDate(date) {
  const selectedDateStr = `${date.getFullYear().toString().slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  
  console.log('Filtering for date:', selectedDateStr); // 디버깅용
  
  // 선택된 날짜의 데이터만 필터링
  const filteredTodos = todos.filter(todo => {
    const parts = todo.text.split(', ');
    const todoDate = parts[0];
    console.log('Todo date:', todoDate, 'Selected date:', selectedDateStr); // 디버깅용
    return todoDate === selectedDateStr;
  });
  
  console.log('Filtered todos:', filteredTodos); // 디버깅용
  
  // 필터링된 데이터로 렌더링
  renderFilteredTodos(filteredTodos);
}

// 필터링된 데이터 렌더링 (페이지네이션 포함)
function renderFilteredTodos(filteredTodos) {
  todoList.innerHTML = '';
  
  if (filteredTodos.length === 0) {
    const noDataElement = document.createElement('div');
    noDataElement.className = 'no-data';
    noDataElement.innerHTML = '<p>선택된 날짜에 데이터가 없습니다.</p>';
    todoList.appendChild(noDataElement);
    paginationButtons.innerHTML = '';
    return;
  }
  
  // 필터링된 데이터에 대한 페이지네이션
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFilteredTodos = filteredTodos.slice(startIndex, endIndex);
  
  paginatedFilteredTodos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    const span = document.createElement('span');
    span.className = 'todo-text' + (todo.completed ? ' completed' : '');
    span.textContent = todo.text;
    span.onclick = () => toggleTodo(todos.indexOf(todo));

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = () => deleteTodo(todos.indexOf(todo));

    li.appendChild(span);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
  
  // 필터링된 데이터에 대한 페이지네이션 렌더링
  renderFilteredPagination(filteredTodos.length);
}

// 필터링된 데이터용 페이지네이션
function renderFilteredPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  paginationButtons.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement('button');
    button.className = `page-btn ${i === currentPage ? 'active' : ''}`;
    button.textContent = i;
    button.onclick = () => {
      currentPage = i;
      // 현재 선택된 날짜의 데이터를 다시 렌더링
      if (selectedDate) {
        filterTodosByDate(selectedDate);
      } else {
        renderTodos();
      }
    };
    paginationButtons.appendChild(button);
  }
}

// 필터 해제 (전체 데이터 보기)
function showAllData() {
  selectedDate = null;
  selectedDateText.textContent = '없음';
  currentPage = 1; // 첫 번째 페이지로 리셋
  renderCalendar();
  renderTodos();
}

// 초기화
loadTodos();
renderCalendar();

// 초기화 시 오늘 날짜를 선택된 상태로 설정
selectedDateText.textContent = `${selectedDate.getFullYear()}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${String(selectedDate.getDate()).padStart(2, '0')}`;

// 초기화 시 오늘 날짜의 데이터만 필터링해서 표시
filterTodosByDate(selectedDate);
