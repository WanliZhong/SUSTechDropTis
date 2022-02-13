// use vuex store to store global data
import {createStore} from "vuex";

const store = createStore({
    state () {
        return {
            login_state: {
                username: "",
                password: "",
            },
            rawCourseData: Object,
            rawGPAData: Object,
            rawSelectionCourseData: Object,
        }
    }
})

export default store
