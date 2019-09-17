import React from 'react';

import {CubeableImage} from '../../images';
import {Cubeable, CubeablesContainer, PrintingCounter} from "../../models/models";
import {alphabeticalPropertySortMethodFactory} from "../../utils/utils";


interface CubeablesCollectionSpoilerViewProps {
  cubeablesContainer: CubeablesContainer
  cubeableType: string
}

export default class CubeablesCollectionSpoilerView extends React.Component<CubeablesCollectionSpoilerViewProps> {

  * groupsSortedChained(groups: IterableIterator<[Cubeable, number]>[]): IterableIterator<Cubeable> {
    for (const group of groups) {
      for (
        const [cubeable, multiplicity] of Array.from(group).sort(
        alphabeticalPropertySortMethodFactory(
          ([cubeable, _]: [Cubeable, number]) => cubeable.getSortValue()
        )
      )
        ) {
        for (let i = 0; i < multiplicity; i++) {
          yield cubeable
        }
      }
    }
  };

  render() {
    const printingCounter = (
      this.props.cubeableType === 'Cubeables' ?
        this.props.cubeablesContainer.printings
        : PrintingCounter.collectFromIterable(
        this.props.cubeablesContainer.allPrintings()
        )
    );

    const groups: IterableIterator<[Cubeable, number]>[] = [
      printingCounter.printings_of_color('W'),
      printingCounter.printings_of_color('U'),
      printingCounter.printings_of_color('B'),
      printingCounter.printings_of_color('R'),
      printingCounter.printings_of_color('G'),
      printingCounter.gold_printings(),
      printingCounter.colorless_printings(),
      printingCounter.land_printings(),
    ];

    if (this.props.cubeableType === 'Cubeables') {
      groups.push(
        this.props.cubeablesContainer.traps_of_intention_types(['SYNERGY', 'NO_INTENTION']),
      );
      groups.push(
        this.props.cubeablesContainer.traps_of_intention_types(['GARBAGE']),
      );
      groups.push(
        this.props.cubeablesContainer.traps_of_intention_types(['OR']),
      );
      groups.push(
        this.props.cubeablesContainer.tickets.items(),
      );
      groups.push(
        this.props.cubeablesContainer.purples.items(),
      );
    }

    return <div>
      {
        Array.from(this.groupsSortedChained(groups)).map(
          (cubeable) => {
            return <CubeableImage
              cubeable={cubeable}
              sizeSlug="thumbnail"
            />
          }
        )
      }
    </div>

  }
}
