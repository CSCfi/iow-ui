import { StoryLine } from '../../help/contract';

export interface HelpProvider {
  getStoryLines(): StoryLine[];
}
