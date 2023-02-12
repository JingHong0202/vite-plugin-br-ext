import main from './main';
import reload from './reload';

export default hot => {
  return hot ? [main(), reload()] : main();
};
