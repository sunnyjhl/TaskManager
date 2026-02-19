// Kanban Task Manager - JavaScript
// Drag and drop functionality with localStorage persistence

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const todoList = document.querySelector('[data-status="todo"]');
const inprogressList = document.querySelector('[data-status="inprogress"]');
const doneList = document.querySelector('[data-status="done"]');
const clearAllBtn = document.getElementById('clearAllBtn');
const modal = document.getElementById('taskModal');
const editInput = document.getElementById('editInput');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// State
let tasks = [];
let currentEditId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateTaskCounts();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    clearAllBtn.addEventListener('click', clearAllTasks);
    
    // Modal event listeners
    saveEditBtn.addEventListener('click', saveEdit);
    cancelEditBtn.addEventListener('click', closeModal);
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Setup drag and drop for all columns
    [todoList, inprogressList, doneList].forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('dragenter', handleDragEnter);
        list.addEventListener('dragleave', handleDragLeave);
        list.addEventListener('drop', handleDrop);
    });
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
        id: Date.now().toString(),
        text: text,
        status: 'todo',
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTask(task);
    updateTaskCounts();
    taskInput.value = '';
    taskInput.focus();
}

// Render a single task
function renderTask(task) {
    const taskCard = createTaskCard(task);
    const list = getTaskListByStatus(task.status);
    list.appendChild(taskCard);
}

// Create task card element
function createTaskCard(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.draggable = true;
    div.id = task.id;
    div.dataset.status = task.status;

    const date = new Date(task.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-actions">
            <button class="edit-btn" title="Edit task">✏️</button>
            <button class="delete-btn" title="Delete task">🗑️</button>
        </div>
        <div class="timestamp">${formattedDate}</div>
    `;

    // Drag events
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);

    // Action buttons
    div.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task));
    div.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    return div;
}

// Get task list by status
function getTaskListByStatus(status) {
    switch(status) {
        case 'todo': return todoList;
        case 'inprogress': return inprogressList;
        case 'done': return doneList;
        default: return todoList;
    }
}

// Drag and Drop Handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain');
    const taskCard = document.getElementById(taskId);
    
    if (!taskCard) return;

    const newStatus = e.currentTarget.dataset.status;
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveTasks();
        e.currentTarget.appendChild(taskCard);
        taskCard.dataset.status = newStatus;
        updateTaskCounts();
    }
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    const taskCard = document.getElementById(id);
    if (taskCard) {
        taskCard.remove();
    }
    updateTaskCounts();
}

// Edit task - Open modal
function openEditModal(task) {
    currentEditId = task.id;
    editInput.value = task.text;
    modal.classList.add('show');
    editInput.focus();
}

// Edit task - Save
function saveEdit() {
    const newText = editInput.value.trim();
    if (!newText || !currentEditId) return;

    const task = tasks.find(t => t.id === currentEditId);
    if (task) {
        task.text = newText;
        saveTasks();
        
        const taskCard = document.getElementById(currentEditId);
        if (taskCard) {
            taskCard.querySelector('.task-text').textContent = newText;
        }
    }
    
    closeModal();
}

// Edit task - Close modal
function closeModal() {
    modal.classList.remove('show');
    currentEditId = null;
    editInput.value = '';
}

// Clear all tasks
function clearAllTasks() {
    if (tasks.length === 0) return;
    
    if (confirm('Are you sure you want to delete all tasks?')) {
        tasks = [];
        saveTasks();
        todoList.innerHTML = '';
        inprogressList.innerHTML = '';
        doneList.innerHTML = '';
        updateTaskCounts();
    }
}

// Update task counts
function updateTaskCounts() {
    document.getElementById('todo-count').textContent = tasks.filter(t => t.status === 'todo').length;
    document.getElementById('inprogress-count').textContent = tasks.filter(t => t.status === 'inprogress').length;
    document.getElementById('done-count').textContent = tasks.filter(t => t.status === 'done').length;
}

// Local Storage Functions
function saveTasks() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem('kanbanTasks');
    if (stored) {
        tasks = JSON.parse(stored);
        tasks.forEach(task => renderTask(task));
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
