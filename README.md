# WebVR Farewell

Interactive WebVR farewell card ([demo](https://b-reel-barcelona.github.io/BRSL_JFARE001/)).

## Usage

```sh
$ npm install
$ npm start
```

# Custom text

The text and the colors are passed as a hash.

```
/#text=Hello&colors=GSGSGS
```

Where:

- `text` is the text to  be displayed.
- `colors` are the colors, one per letter (Gold, Silver, Gold, Silver, Gold, Silver in the above example).

## Linebreak

To break a line, add `\n` in the text.

```
/#text=Hello\nWorld
```

## Available colors

* Silver, abbrev `S`
* Gold, abbrev `G`

## Available Characters

- `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`
- `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

## Notes

- If `colors` is missing, they will be random.
- Don't forget to add spaces for both spaces and line breaks in `colors` (e.g: for `Hello World\nAgain`, `GGGG SSSSS GGGG`).
- This isn't case sensitive, so `HELLO`, `hello` or `HeLlO` are the same.

## Cheats

- Pressing `Q` will attract all the letters, and thus complete the game.
- `Space` will release all the letters.
