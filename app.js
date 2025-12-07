// ===================================
// STATE & DOM ELEMENTS
// ===================================
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');

// Stats
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const completedTasksEl = document.getElementById('completedTasks');

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateStats();
    setupEventListeners();
});

// ===================================
// EVENT LISTENERS
// ===================================
function setupEventListeners() {
    // Add task
    taskForm.addEventListener('submit', handleAddTask);

    // Filter tasks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });

    // Clear completed
    clearCompletedBtn.addEventListener('click', handleClearCompleted);
}

// ===================================
// TASK MANAGEMENT
// ===================================
function handleAddTask(e) {
    e.preventDefault();

    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();

    // Clear input and add success animation
    taskInput.value = '';
    taskInput.focus();
    showNotification('Task added successfully!');
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
    showNotification('Task deleted!');
}

function startEditTask(id) {
    editingTaskId = id;
    renderTasks();
}

function saveEditTask(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (task && newText.trim()) {
        task.text = newText.trim();
        saveTasks();
    }
    editingTaskId = null;
    renderTasks();
    updateStats();
}

function cancelEdit() {
    editingTaskId = null;
    renderTasks();
}

function handleClearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    updateStats();
    showNotification(`${completedCount} completed task(s) cleared!`);
}

// ===================================
// RENDERING
// ===================================
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    tasksList.innerHTML = filteredTasks.map(task => {
        const isEditing = editingTaskId === task.id;

        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
                
                ${isEditing ? `
                    <input 
                        type="text" 
                        class="task-edit-input" 
                        value="${escapeHtml(task.text)}"
                        id="editInput-${task.id}"
                        onkeydown="handleEditKeydown(event, ${task.id})"
                        autofocus
                    >
                ` : `
                    <span class="task-text">${escapeHtml(task.text)}</span>
                `}
                
                <div class="task-actions">
                    ${isEditing ? `
                        <button class="task-btn btn-save" onclick="saveEdit(${task.id})" title="Save">
                            ✓
                        </button>
                        <button class="task-btn btn-cancel" onclick="cancelEdit()" title="Cancel">
                            ✕
                        </button>
                    ` : `
                        <button class="task-btn btn-edit" onclick="startEditTask(${task.id})" title="Edit">
                            ✎
                        </button>
                        <button class="task-btn btn-delete" onclick="deleteTask(${task.id})" title="Delete">
                            🗑
                        </button>
                    `}
                </div>
            </li>
        `;
    }).join('');
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;

    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;

    // Update clear button state
    clearCompletedBtn.disabled = completed === 0;
}

// ===================================
// EDIT HELPERS
// ===================================
function saveEdit(id) {
    const input = document.getElementById(`editInput-${id}`);
    if (input) {
        saveEditTask(id, input.value);
    }
}

function handleEditKeydown(event, id) {
    if (event.key === 'Enter') {
        saveEdit(id);
    } else if (event.key === 'Escape') {
        cancelEdit();
    }
}

// ===================================
// LOCAL STORAGE
// ===================================
function saveTasks() {
    localStorage.setItem('taskmaster-tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem('taskmaster-tasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading tasks:', e);
            tasks = [];
        }
    }
}

// ===================================
// UTILITIES
// ===================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    // Simple console notification for now
    // You can enhance this with a toast notification
    console.log('✓', message);
}

// ===================================
// KEYBOARD SHORTCUTS
// ===================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on task input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        taskInput.focus();
    }
});

// ===================================
// EXPORT DATA (Optional Feature)
// ===================================
function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// ===================================
// CONSOLE WELCOME MESSAGE
// ===================================
console.log('%c🎯 TaskMaster', 'font-size: 24px; font-weight: bold; color: #6366f1;');
console.log('%cBuilt by Soreti', 'font-size: 14px; color: #a1a1aa;');
console.log('%cKeyboard shortcut: Ctrl/Cmd + K to focus on input', 'font-size: 12px; color: #71717a;');
