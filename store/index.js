export const state = () => ({
  date: new Date()
})

export const mutations = {
  date(state, val) {
    state.date = val
  }
}
