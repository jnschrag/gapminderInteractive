/* ======================================
=            Sidebar Mobile            =
====================================== */

function sidebarMobile () {
  var sidebar = document.querySelector('.sidebar')
  var overlay = document.querySelector('.container-overlay')
  var optionBtns = document.querySelectorAll('.sidebar-options')

  Array.from(optionBtns).forEach(btn => {
    btn.addEventListener('click', toggleSidebar)
  })

  overlay.addEventListener('click', toggleSidebar)

  function toggleSidebar () {
    sidebar.classList.toggle('is-visible')
    overlay.classList.toggle('sidebar-active')
    document.body.classList.toggle('sidebar-active')
  }
}

export { sidebarMobile }
