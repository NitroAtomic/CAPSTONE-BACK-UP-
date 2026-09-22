// Backend and integration: IamAtomic
//
// Whether the user is in the middle of answering the awareness assessment.
// The assessment's intro, questions and results all live on one page, so the
// chat widget can't tell from the URL alone; the assessment sets this while
// questions are on screen, and the widget hides itself while it's true.
import { reactive } from 'vue'

export default reactive({ assessmentInProgress: false })
