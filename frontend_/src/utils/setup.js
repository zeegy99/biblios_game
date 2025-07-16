export class Die {
  constructor(resource_type) {
    this.resource_type = resource_type;
    this.value = Math.floor(Math.random() * 3) + 2; // gives 2, 3, or 4
  }
}

export const rollDice = () => [
  new Die("Religion"),
  new Die("Science"),
  new Die("Military"),
  new Die("Art"),
  new Die("Herbs"),
];
