import main from './main'
import reload from './reload'

export default (hot: boolean) => {
  return hot ? [main(), reload()] : main()
}
