// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
//
// ## Description
//
// This file implements chord symbols as modifiers that can be attached to
// notes.  Chord symbols can contain multiple 'blocks' which can contain
// text or glyphs with various positioning options.
//
// See `tests/chordsymbol_tests.js` for usage examples.

import { Vex } from './vex';
import { Flow } from './tables';
import { Glyph } from './glyph';
import { Modifier } from './modifier';

// To enable logging for this class. Set `Vex.Flow.ChordSymbol.DEBUG` to `true`.
function L(...args) { if (ChordSymbol.DEBUG) Vex.L('Vex.Flow.ChordSymbol', args); }

// change case
export class ChordSymbol extends Modifier {
  static get CATEGORY() { return 'chordSymbol'; }

  // Chord symbols can be positioned and justified relative to the note.
  static get horizontalJustify() {
    return {
      LEFT: 1,
      CENTER: 2,
      RIGHT: 3,
      CENTER_STEM: 4,
    };
  }

  static get horizontalJustifyString() {
    return {
      left: ChordSymbol.horizontalJustify.LEFT,
      right: ChordSymbol.horizontalJustify.RIGHT,
      center: ChordSymbol.horizontalJustify.CENTER,
      centerStem: ChordSymbol.horizontalJustify.CENTER_STEM,
    };
  }


  static get verticalJustify() {
    return {
      TOP: 1,
      BOTTOM: 2,
    };
  }

  static get DEBUG() {
    return ChordSymbol.debug;
  }

  static set DEBUG(val) {
    ChordSymbol.debug = val;
  }

  static get verticalJustifyString() {
    return {
      top: ChordSymbol.verticalJustify.TOP,
      above: ChordSymbol.verticalJustify.TOP,
      below: ChordSymbol.verticalJustify.BOTTOM,
      bottom: ChordSymbol.verticalJustify.BOTTOM
    };
  }

  // Glyph data
  static get glyphs() {
    return {
      'diminished': {
        code: 'csymDiminished',
      },
      'dim': {
        code: 'csymDiminished',
      },
      'halfDiminished': {
        code: 'csymHalfDiminished',
      },
      '+': {
        code: 'csymAugmented',
      },
      'augmented': {
        code: 'csymAugmented',
      },
      'majorSeventh': {
        code: 'csymMajorSeventh',
      },
      'minor': {
        code: 'csymMinor',
      },
      '-': {
        code: 'csymMinor',
      },
      '(': {
        code: 'csymParensLeftTall',
      },
      'leftParen': {
        code: 'csymParensLeftTall',
      },
      ')': {
        code: 'csymParensRightTall',
      },
      'rightParen': {
        code: 'csymParensRightTall',
      },
      'leftBracket': {
        code: 'csymBracketLeftTall',
      },
      'rightBracket': {
        code: 'csymBracketRightTall',
      },
      'leftParenTall': {
        code: 'csymParensLeftVeryTall',
      },
      'rightParenTall': {
        code: 'csymParensRightVeryTall',
      },
      '/': {
        code: 'csymDiagonalArrangementSlash',
      },
      'over': {
        code: 'csymDiagonalArrangementSlash',
      },
      '#': {
        code: 'accidentalSharp',
      },
      'b': {
        code: 'accidentalFlat',
      }
    };
  }

  static get symbolTypes() {
    return {
      GLYPH: 1,
      TEXT: 2,
      LINE: 3
    };
  }

  static get symbolModifiers() {
    return {
      NONE: 1,
      SUBSCRIPT: 2,
      SUPERSCRIPT: 3
    };
  }

  static get chordSymbolMetrics() {
    return Vex.Flow.DEFAULT_FONT_STACK[0].metrics.glyphs.chordSymbol;
  }

  static get lowerKerningText() {
    return ['D', 'F', 'I', 'P', 'T', 'V', 'Y'];
  }

  static get upperKerningText() {
    return ['A', 'I', 'L'];
  }

  // ### format
  // try to estimate the width of the whole chord symbol, based on the
  // sum of the widths of the individual blocks.  Also estimate how many
  // lines above/below the staff we need`
  static format(instances, state) {
    if (!instances || instances.length === 0) return false;

    let width = 0;
    let nonSuperWidth = 0;

    for (let i = 0; i < instances.length; ++i) {
      const instance = instances[i];
      const fontAdj = instance.font.size / 10;
      let lineSpaces = 1;

      for (let j = 0; j < instance.symbolBlocks.length; ++j) {
        const symbol = instance.symbolBlocks[j];
        const sup = instance.isSuperscript(symbol);
        const sub = instance.isSubscript(symbol);

        // If there are super/subscripts, they extend beyond the line so
        // assume they take up 2 lines
        if (sup || sub) {
          lineSpaces = 2;
        }

        // If there is a symbol-specific offset, add it but consider font
        // size since font and glyphs will be interspersed
        if (symbol.symbolType === ChordSymbol.symbolTypes.GLYPH) {
          symbol.yShift += symbol.glyph.metrics.y_shift;
        }

        if (symbol.symbolType === ChordSymbol.symbolTypes.GLYPH) {
          symbol.glyph.scale = symbol.glyph.scale * fontAdj;
        }

        if (symbol.symbolType === ChordSymbol.symbolTypes.GLYPH &&
          symbol.glyph.code === ChordSymbol.glyphs.over.code) {
          lineSpaces = 2;
          symbol.xShift += symbol.glyph.metrics.x_shift;
        }

        if (j > 0 && instance.symbolBlocks[j - 1].symbolType === ChordSymbol.symbolTypes.GLYPH &&
          instance.symbolBlocks[j - 1].glyph.code === ChordSymbol.glyphs.over.code) {
          symbol.xShift += instance.symbolBlocks[j - 1].glyph.metrics.x_shift;
        }

        // If a subscript immediately  follows a superscript block, try to
        // overlay them.
        if (sup && j > 0) {
          const prev = instance.symbolBlocks[j - 1];
          if (!instance.isSuperscript(prev)) {
            nonSuperWidth = width;
          }
        }
        if (sub && nonSuperWidth > 0) {
          // slide the symbol over so it lines up with superscript
          symbol.xShift = nonSuperWidth - width;
          width = nonSuperWidth - symbol.width;
          nonSuperWidth = 0;
          // If we have vertically lined up, turn kerning off.
          instance.setEnableKerning(false);
        }
        if (!sup && !sub) {
          nonSuperWidth = 0;
        }
        width += symbol.width;
      }

      // make kerning adjustments after computing super/subscripts
      instance.updateKerningAjustments();

      if (instance.getVertical() === ChordSymbol.verticalJustify.TOP) {
        instance.setTextLine(state.top_text_line);
        state.top_text_line += lineSpaces;
      } else {
        instance.setTextLine(state.text_line + 1);
        state.text_line += lineSpaces + 1;
      }
    }

    state.left_shift += width / 2;
    state.right_shift += width / 2;
    return true;
  }

  // ## Prototype Methods
  //
  // chordSymbol is a modifier that creates a chord symbol above/below a chord
  // This is the modifier version, meaning it is attached to an existing note.
  constructor() {
    super();
    this.setAttribute('type', 'ChordSymbol');
    this.note = null;
    this.index = null;
    this.symbolBlocks = [];
    this.horizontal = ChordSymbol.horizontalJustify.CENTER_STEM;
    this.vertical = ChordSymbol.verticalJustify.TOP;
    this.useKerning = true;

    let fontFamily = 'Arial';
    if (this.musicFont.name === 'Petaluma') {
      fontFamily = 'Cursive';
    }
    this.font = {
      family: fontFamily,
      size: 10,
      weight: '',
    };
  }

  updateKerningAjustments() {
    for (let j = 0; j < this.symbolBlocks.length; ++j) {
      const symbol = this.symbolBlocks[j];
      symbol.xShift += this.getKerningAdjustment(j);
    }
  }

  // ### getKerningAdjustment
  // Do some very basic kerning so that letter chords like 'A' don't have
  // the extensions hanging off to the right.
  getKerningAdjustment(j) {
    if (!this.useKerning) {
      return 0;
    }
    const symbol = this.symbolBlocks[j];
    const kernConst = ChordSymbol.chordSymbolMetrics.global.kerningOffset;
    const prevSymbol = j > 0 ? this.symbolBlocks[j - 1] : null;
    let rv = 0;


    // Move things into the '/' over bar
    if (symbol.symbolType === ChordSymbol.symbolTypes.GLYPH &&
      symbol.glyph.code === ChordSymbol.glyphs.over.code) {
      rv += symbol.glyph.metrics.x_shift;
    }

    if (prevSymbol !== null &&
      prevSymbol.symbolType === ChordSymbol.symbolTypes.GLYPH &&
      prevSymbol.glyph.code === ChordSymbol.glyphs.over.code) {
      rv += prevSymbol.glyph.metrics.x_shift;
    }

    // For superscripts that follow a letter without much top part, move it to the
    // left slightly
    let preKernUpper = false;
    let preKernLower = false;
    if (prevSymbol != null && prevSymbol.symbolType === ChordSymbol.symbolTypes.TEXT) {
      preKernUpper = ChordSymbol.upperKerningText.some((xx) => xx === prevSymbol.text[prevSymbol.text.length - 1]);
      preKernLower = ChordSymbol.lowerKerningText.some((xx) => xx === prevSymbol.text[prevSymbol.text.length - 1]);
    }

    // TODO: adjustkern for  for font size.
    // Where should this constant live?
    if (preKernUpper && symbol.symbolModifier === ChordSymbol.symbolModifiers.SUPERSCRIPT) {
      rv += kernConst;
    }

    if (preKernLower && symbol.symbolType === ChordSymbol.symbolTypes.TEXT) {
      if (symbol.text[0] >= 'a' && symbol.text[0] <= 'z') {
        rv += kernConst / 2;
      }
      if (ChordSymbol.upperKerningText.some((xx) => xx === prevSymbol.text[prevSymbol.text.length - 1])) {
        rv += kernConst / 2;
      }
    }
    return rv;
  }

  // ### getSymbolBlock
  // ChordSymbol allows multiple blocks so we can mix glyphs and font text.
  // Each block can have its own vertical orientation
  getSymbolBlock(parameters) {
    parameters = parameters == null ? {} : parameters;
    const symbolType = (parameters.symbolType ? parameters.symbolType : ChordSymbol.symbolTypes.TEXT);
    const text = parameters.text ? parameters.text : '';
    const symbolModifier = parameters.symbolModifier ? parameters.symbolModifier : ChordSymbol.symbolModifiers.NONE;
    const xShift = 0;
    const yShift = 0;

    const rv = {
      text, symbolType, symbolModifier, xShift, yShift
    };

    rv.width = 0;
    if (symbolType === ChordSymbol.symbolTypes.GLYPH && typeof(parameters.glyph) === 'string') {
      const glyphArgs = ChordSymbol.glyphs[parameters.glyph];
      let glyphPoints = 20;
      // super and subscript are smaller
      if (symbolModifier !== ChordSymbol.symbolModifiers.NONE) {
        glyphPoints = glyphPoints / 1.3;
      }
      rv.glyph = new Glyph(glyphArgs.code, glyphPoints, { category: 'chordSymbol' });
      // Beware: glyph.metrics is not the same as glyph.getMetrics() !
      rv.glyph.point = rv.glyph.point * rv.glyph.metrics.scale;
      rv.width = (rv.glyph.getMetrics().width * 3) / 2;
      // don't set yShift here, b/c we need to do it at formatting time after the font is set.
    } else if (symbolType === ChordSymbol.symbolTypes.TEXT) {
      rv.width = Flow.textWidth(text);
    } else if (symbolType === ChordSymbol.symbolTypes.LINE) {
      rv.width = parameters.width;
    }

    return rv;
  }

  // ### addSymbolBlock
  // Add a symbol to this chord, could be text, glyph or line.
  addSymbolBlock(parameters) {
    this.symbolBlocks.push(this.getSymbolBlock(parameters));
    return this;
  }

  // ### Convenience functions follow that let you create different types of
  // chord symbol parts easily
  // ### addText
  // Add a text block
  addText(text, parameters) {
    parameters = parameters == null ? {} : parameters;
    parameters.text = text;
    parameters.symbolType = ChordSymbol.symbolTypes.TEXT;
    return this.addSymbolBlock(parameters);
  }

  // ### addTextSuperscript
  // add a text block with superscript modifier
  addTextSuperscript(text) {
    const symbolType = ChordSymbol.symbolTypes.TEXT;
    const symbolModifier = ChordSymbol.symbolModifiers.SUPERSCRIPT;
    return this.addSymbolBlock({ text, symbolType, symbolModifier });
  }

  // ### addTextSubscript
  // add a text block with subscript modifier
  addTextSubscript(text) {
    const symbolType = ChordSymbol.symbolTypes.TEXT;
    const symbolModifier = ChordSymbol.symbolModifiers.SUBSCRIPT;
    return this.addSymbolBlock({ text, symbolType, symbolModifier });
  }

  // ### addGlyphSuperscript
  // add a glyph block with superscript modifier
  addGlyphSuperscript(glyph) {
    const symbolType = ChordSymbol.symbolTypes.GLYPH;
    const symbolModifier = ChordSymbol.symbolModifiers.SUPERSCRIPT;
    return this.addSymbolBlock({ glyph, symbolType, symbolModifier });
  }

  addGlyph(glyph, parameters) {
    parameters = parameters == null ? {} : parameters;
    parameters.glyph = glyph;
    parameters.symbolType = ChordSymbol.symbolTypes.GLYPH;
    return this.addSymbolBlock(parameters);
  }

  // ### addGlyphOrText
  // Add a glyph for each character in 'text'.  If the glyph is not
  // available, use text from the font.  E.g.:
  // `addGlyphOrText("(+5#11)")`
  // will use text for the '5' and '11', and glyphs for everything else.
  addGlyphOrText(text, parameters) {
    parameters = parameters == null ? {} : parameters;
    let str = '';
    for (let i = 0; i < text.length; ++i) {
      if (ChordSymbol.glyphs[text[i]]) {
        if (str.length > 0) {
          this.addText(str, parameters);
          str = '';
        }
        this.addGlyph(text[i], parameters);
      } else {
        str += text[i];
      }
    }
    if (str.length > 0) {
      this.addText(str, parameters);
    }
    return this;
  }

  // ### Add a line of the given width, used as a continuation of the previous
  // symbol in analysis, or lyrics, etc.
  addLine(width, parameters) {
    parameters = parameters == null ? {} : parameters;
    parameters.symbolType = ChordSymbol.symbolTypes.LINE;
    parameters.width = width;
    return this.addSymbolBlock(parameters);
  }

  getCategory() { return ChordSymbol.CATEGORY; }

  // Set font family, size, and weight. E.g., `Arial`, `10pt`, `Bold`.
  setFont(family, size, weight) {
    this.font = { family, size, weight };
    return this;
  }

  setFontSize(size) {
    this.font.size = size;
    return this;
  }

  setEnableKerning(val) {
    this.useKerning = val;
    return this;
  }

  // Set vertical position of text (above or below stave). `just` must be
  // a value in `ChordSymbol.vertical`.
  setVertical(just) {
    this.vertical = typeof (just) === 'string'
      ? ChordSymbol.verticalJustifyString[just]
      : just;
    return this;
  }
  getVertical() {
    return this.vertical;
  }

  // Get and set horizontal justification. `justification` is a value in
  // `ChordSymbol.Justify`.
  setHorizontal(just) {
    this.horizontal = typeof (just) === 'string'
      ? ChordSymbol.horizontalJustifyString[just]
      : just;
    return this;
  }

  getWidth() {
    let rv = 0;
    this.symbolBlocks.forEach((symbol) => {
      rv += symbol.width;
    });
    return rv;
  }

  isSuperscript(symbol) {
    return symbol.symbolModifier !== null && symbol.symbolModifier === ChordSymbol.symbolModifiers.SUPERSCRIPT;
  }

  isSubscript(symbol) {
    return symbol.symbolModifier !== null && symbol.symbolModifier === ChordSymbol.symbolModifiers.SUBSCRIPT;
  }

  // Render text and glyphs above/below the note
  draw() {
    this.checkContext();
    this.setRendered();

    if (!this.note) {
      throw new Vex.RERR(
        'NoNoteForAnnotation', "Can't draw text annotation without an attached note."
      );
    }

    // We're changing context parameters. Save current state.
    this.context.save();
    const start = this.note.getModifierStartXY(Modifier.Position.ABOVE,
      this.index);
    this.context.setFont(this.font.family, this.font.size, this.font.weight);

    let y;

    let stem_ext;
    let spacing;
    const has_stem = this.note.hasStem();
    const stave = this.note.getStave();

    // The position of the text varies based on whether or not the note
    // has a stem.
    if (has_stem) {
      stem_ext = this.note.getStem().getExtents();
      spacing = stave.getSpacingBetweenLines();
    }

    if (this.vertical === ChordSymbol.verticalJustify.BOTTOM) {
      // HACK: We need to compensate for the text's height since its origin
      // is bottom-right.
      y = stave.getYForBottomText(this.text_line + Flow.TEXT_HEIGHT_OFFSET_HACK);
      if (has_stem) {
        const stem_base = (this.note.getStemDirection() === 1 ? stem_ext.baseY : stem_ext.topY);
        y = Math.max(y, stem_base + (spacing * (this.text_line + 2)));
      }
    } else  { // (this.vertical === ChordSymbol.verticalJustify.TOP)
      y = Math.min(stave.getYForTopText(this.text_line), this.note.getYs()[0] - 10);
      if (has_stem) {
        y = Math.min(y, (stem_ext.topY - 5) - (spacing * this.text_line));
      }
    }

    let x = start.x;
    if (this.horizontal === ChordSymbol.horizontalJustify.LEFT) {
      x = start.x;
    } else if (this.horizontal === ChordSymbol.horizontalJustify.RIGHT) {
      x = start.x - this.getWidth();
    } else if (this.horizontal === ChordSymbol.horizontalJustify.CENTER) {
      x = start.x - this.getWidth() / 2;
    } else /* CENTER_STEM */ {
      x = this.note.getStemX() -  this.getWidth() / 2;
    }
    L('Rendering ChordSymbol: ', this.text, x, y);

    const fontAdj = this.font.size / 10;
    this.symbolBlocks.forEach((symbol) => {
      const sp = this.isSuperscript(symbol);
      const sub = this.isSubscript(symbol);
      let curY = y;
      L('shift was ', symbol.xShift, symbol.yShift);
      symbol.xShift *= fontAdj;
      symbol.yShift *= fontAdj;
      L('shift font adj ', symbol.xShift, symbol.yShift);
      L('curY pre sub ', curY);
      if (sp) {
        curY += ChordSymbol.chordSymbolMetrics.global.superscriptOffset * fontAdj;
      }
      if (sub) {
        curY += ChordSymbol.chordSymbolMetrics.global.subscriptOffset * fontAdj;
      }
      L('curY sup/sub ', curY);

      if (symbol.symbolType === ChordSymbol.symbolTypes.TEXT) {
        if (sp || sub) {
          this.context.save();
          this.context.setFont(this.font.family, this.font.size / 1.3, this.font.weight);
        }
        // We estimate the text width, fill it in with the empirical value so the
        // formatting is even.
        const textDim = this.context.measureText(symbol.text);
        symbol.width = textDim.width;
        symbol.width = (symbol.width * 4) / 3;
        L('Rendering Text: ', symbol.text, x + symbol.xShift, curY);

        this.context.fillText(symbol.text, x + symbol.xShift, curY);
        if (sp || sub) {
          this.context.restore();
        }
      } else if (symbol.symbolType === ChordSymbol.symbolTypes.GLYPH) {
        curY += symbol.yShift;
        L('Rendering Glyph: ', symbol.glyph.code, x + symbol.xShift, curY);
        symbol.glyph.render(this.context, x + symbol.xShift, curY);
      } else if (symbol.symbolType === ChordSymbol.symbolTypes.LINE) {
        L('Rendering Line : ', symbol.width, x, curY);
        this.context.beginPath();
        this.context.setLineWidth(1); // ?
        this.context.moveTo(x, y);
        this.context.lineTo(x + symbol.width, curY);
        this.context.stroke();
      }

      x += symbol.width + symbol.xShift;
    });

    this.context.restore();
  }
}
