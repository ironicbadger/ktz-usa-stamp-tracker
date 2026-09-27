(()=>{
 const root=document.documentElement;
 function saved(){try{return localStorage.getItem('stamp-book-theme')}catch{return null}}
 function apply(theme){root.dataset.theme=theme;root.style.colorScheme=theme;document.querySelectorAll('[data-theme-toggle]').forEach(button=>{if(!button.classList.contains('theme-icon'))button.textContent=theme==='dark'?'Light mode':'Dark mode';button.title=theme==='dark'?'Switch to light mode':'Switch to dark mode';button.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode')});document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>meta.content=theme==='dark'?'#272824':'#ffffff')}
 apply(saved()==='light'?'light':'dark');
 document.addEventListener('DOMContentLoaded',()=>apply(root.dataset.theme));
 document.addEventListener('click',event=>{if(event.target.closest('[data-theme-toggle]')){const theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('stamp-book-theme',theme)}catch{}apply(theme)}});
 addEventListener('storage',event=>{if(event.key==='stamp-book-theme')apply(event.newValue==='light'?'light':'dark')});
})();
