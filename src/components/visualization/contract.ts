import { Coordinate } from '../../entities/contract';

export interface ClassInteractionListener {
  onClassClick(classId: string): void;
  onClassHover(classId: string, coordinate: Coordinate): void;
  onPropertyHover(classId: string, propertyId: string, coordinate: Coordinate): void;
  onHoverExit(): void;
}
