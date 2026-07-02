import { TilesConverter } from "./tile";

export class Meld {
  static CHI = "chi";
  static PON = "pon";
  static KAN = "kan";
  static SHOUMINKAN = "shouminkan";
  static NUKI = "nuki";

  type: string | null;
  opened: boolean;
  called_tile: number | null;
  who: number | null;
  from_who: number | null;
  private _tiles: number[];
  private _tiles34Cache: number[] | null = null;

  constructor(paramsOrMeldType: {
    meld_type?: string | null;
    tiles?: Iterable<number> | null;
    opened?: boolean;
    called_tile?: number | null;
    who?: number | null;
    from_who?: number | null;
  } | string | null = {},
    tilesArg: Iterable<number> | null = null,
    openedArg = true,
    calledTileArg: number | null = null,
    whoArg: number | null = null,
    fromWhoArg: number | null = null
  ) {
    const params = (typeof paramsOrMeldType === "object" && paramsOrMeldType !== null && !Array.isArray(paramsOrMeldType)
        ? paramsOrMeldType
        : {
            meld_type: paramsOrMeldType,
            tiles: tilesArg,
            opened: openedArg,
            called_tile: calledTileArg,
            who: whoArg,
            from_who: fromWhoArg
          }) as {
      meld_type?: string | null;
      tiles?: Iterable<number> | null;
      opened?: boolean;
      called_tile?: number | null;
      who?: number | null;
      from_who?: number | null;
    };
    const { meld_type = null, tiles = null, opened = true, called_tile = null, who = null, from_who = null } = params;
    this.type = meld_type;
    this._tiles = tiles ? [...tiles] : [];
    this.opened = opened;
    this.called_tile = called_tile;
    this.who = who;
    this.from_who = from_who;
  }

  get tiles(): number[] {
    return [...this._tiles];
  }

  set tiles(value: Iterable<number>) {
    this._tiles = [...value];
    this._tiles34Cache = null;
  }

  get tiles_34(): number[] {
    if (this._tiles34Cache === null) {
      this._tiles34Cache = this._tiles.map((x) => Math.floor(x / 4));
    }
    return [...this._tiles34Cache];
  }

  toString(): string {
    return `Type: ${this.type}, Tiles: ${TilesConverter.to_one_line_string(this._tiles)} (${this._tiles.join(", ")})`;
  }
}
