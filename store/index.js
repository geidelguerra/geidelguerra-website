const state = () => ({
  headerFixed: false,
  menuOpen: false,
})

const mutations = {
  setMenuOpen (state, value) {
    state.menuOpen = value;
  }
}

export default {
  state,
  mutations,
}
