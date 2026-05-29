const SYMBOLS = {
  numbers: {
    '0': { latex: '0', features: ['closed_loop', 'horizontal_bottom', 'symmetric'] },
    '1': { latex: '1', features: ['vertical_stroke', 'top_horizontal'] },
    '2': { latex: '2', features: ['top_curve', 'middle_horizontal', 'bottom_curve'] },
    '3': { latex: '3', features: ['two_curved_tops', 'bottom_curve'] },
    '4': { latex: '4', features: ['top_angle', 'vertical_stroke', 'horizontal_stroke'] },
    '5': { latex: '5', features: ['top_horizontal', 'upper_curve', 'bottom_horizontal'] },
    '6': { latex: '6', features: ['closed_loop', 'bottom_curve'] },
    '7': { latex: '7', features: ['top_horizontal', 'diagonal_stroke'] },
    '8': { latex: '8', features: ['two_closed_loops', 'symmetric'] },
    '9': { latex: '9', features: ['top_loop', 'vertical_stroke'] },
  },
  letters: {
    'a': { latex: 'a', features: ['open_top', 'curved_right', 'bottom_loop'] },
    'b': { latex: 'b', features: ['vertical_stroke', 'two_lower_loops'] },
    'c': { latex: 'c', features: ['open_right', 'curved_shape'] },
    'd': { latex: 'd', features: ['vertical_stroke', 'right_loop'] },
    'e': { latex: 'e', features: ['horizontal_stroke', 'curved_bottom'] },
    'f': { latex: 'f', features: ['top_horizontal', 'vertical_stroke', 'middle_horizontal'] },
    'g': { latex: 'g', features: ['open_top', 'bottom_loop'] },
    'h': { latex: 'h', features: ['two_vertical_strokes', 'connected_middle'] },
    'i': { latex: 'i', features: ['vertical_stroke', 'dot_top'] },
    'j': { latex: 'j', features: ['curved_top', 'dot_top', 'vertical_stroke'] },
    'k': { latex: 'k', features: ['vertical_stroke', 'two_diagonals'] },
    'l': { latex: 'l', features: ['vertical_stroke', 'top_horizontal'] },
    'm': { latex: 'm', features: ['three_peaks', 'connected_baseline'] },
    'n': { latex: 'n', features: ['two_peaks', 'connected_baseline'] },
    'o': { latex: 'o', features: ['closed_loop', 'circular'] },
    'p': { latex: 'p', features: ['vertical_stroke', 'lower_loop'] },
    'q': { latex: 'q', features: ['closed_loop', 'lower_tail'] },
    'r': { latex: 'r', features: ['vertical_stroke', 'curved_leg'] },
    's': { latex: 's', features: ['two_curves', 'no_vertical'] },
    't': { latex: 't', features: ['top_horizontal', 'vertical_stroke'] },
    'u': { latex: 'u', features: ['open_top', 'curved_bottom'] },
    'v': { latex: 'v', features: ['pointed_bottom', 'two_slants'] },
    'w': { latex: 'w', features: ['four_peaks', 'connected'] },
    'x': { latex: 'x', features: ['two_diagonals', 'cross'] },
    'y': { latex: 'y', features: ['two_slants', 'lower_tail'] },
    'z': { latex: 'z', features: ['top_horizontal', 'diagonal', 'bottom_horizontal'] },
    'A': { latex: 'A', features: ['pointed_top', 'two_sides', 'middle_horizontal'] },
    'B': { latex: 'B', features: ['vertical_stroke', 'two_loops'] },
    'C': { latex: 'C', features: ['open_right', 'curved'] },
    'D': { latex: 'D', features: ['vertical_stroke', 'large_loop'] },
    'E': { latex: 'E', features: ['vertical_stroke', 'three_horizontals'] },
    'F': { latex: 'F', features: ['vertical_stroke', 'two_horizontals'] },
    'G': { latex: 'G', features: ['curved_left', 'bottom_horizontal', 'small_tail'] },
    'H': { latex: 'H', features: ['two_verticals', 'middle_horizontal'] },
    'I': { latex: 'I', features: ['vertical_stroke', 'top_bottom_horizontals'] },
    'J': { latex: 'J', features: ['curved_top', 'vertical_stroke', 'bottom_hook'] },
    'K': { latex: 'K', features: ['vertical_stroke', 'two_diagonals'] },
    'L': { latex: 'L', features: ['vertical_stroke', 'bottom_horizontal'] },
    'M': { latex: 'M', features: ['peaked_shape', 'multiple_points'] },
    'N': { latex: 'N', features: ['two_verticals', 'diagonal_connect'] },
    'O': { latex: 'O', features: ['closed_circle', 'symmetric'] },
    'P': { latex: 'P', features: ['vertical_stroke', 'upper_loop'] },
    'Q': { latex: 'Q', features: ['closed_loop', 'diagonal_tail'] },
    'R': { latex: 'R', features: ['vertical_stroke', 'loop', 'diagonal'] },
    'S': { latex: 'S', features: ['curved_top_bottom', 'no_straight'] },
    'T': { latex: 'T', features: ['top_horizontal', 'vertical_middle'] },
    'U': { latex: 'U', features: ['two_verticals', 'curved_bottom'] },
    'V': { latex: 'V', features: ['pointed', 'two_slants'] },
    'W': { latex: 'W', features: ['multiple_slants', 'wide'] },
    'X': { latex: 'X', features: ['two_crossing_diagonals'] },
    'Y': { latex: 'Y', features: ['pointed_top', 'two_slants', 'vertical'] },
    'Z': { latex: 'Z', features: ['top_horizontal', 'diagonal', 'bottom_horizontal'] },
  },
  operators: {
    '+': { latex: '+', features: ['horizontal_stroke', 'vertical_stroke', 'cross_center'] },
    '-': { latex: '-', features: ['single_horizontal', 'no_vertical'] },
    '=': { latex: '=', features: ['two_horizontals', 'parallel'] },
    'times': { latex: '\\times', features: ['four_diagonals', 'cross'] },
    'div': { latex: '\\div', features: ['horizontal_stroke', 'two_dots'] },
    'pm': { latex: '\\pm', features: ['plus_minus', 'combined'] },
    'mp': { latex: '\\mp', features: ['minus_plus', 'combined'] },
    'cdot': { latex: '\\cdot', features: ['single_dot', 'small'] },
    'ast': { latex: '\\ast', features: ['star_shape', 'multiple_points'] },
    'circ': { latex: '\\circ', features: ['small_circle', 'open'] },
    'oplus': { latex: '\\oplus', features: ['circle_plus', 'combined'] },
    'ominus': { latex: '\\ominus', features: ['circle_minus', 'combined'] },
    'otimes': { latex: '\\otimes', features: ['circle_times', 'combined'] },
    'oslash': { latex: '\\oslash', features: ['circle_div', 'combined'] },
    'cap': { latex: '\\cap', features: ['intersection', 'downward_curve'] },
    'cup': { latex: '\\cup', features: ['union', 'upward_curve'] },
    'subset': { latex: '\\subset', features: ['subset_shape', 'open'] },
    'supset': { latex: '\\supset', features: ['supset_shape', 'open'] },
    'subseteq': { latex: '\\subseteq', features: ['subset_equal', 'combined'] },
    'supseteq': { latex: '\\supseteq', features: ['supset_equal', 'combined'] },
    'in': { latex: '\\in', features: ['element', 'curved'] },
    'notin': { latex: '\\notin', features: ['not_element', 'combined'] },
    'exists': { latex: '\\exists', features: ['exists_symbol', 'backwards_e'] },
    'forall': { latex: '\\forall', features: ['forall_symbol', 'upside_down_a'] },
    'neg': { latex: '\\neg', features: ['negation', 'short_slash'] },
    'implies': { latex: '\\implies', features: ['implication', 'double_arrow'] },
    'iff': { latex: '\\iff', features: ['biconditional', 'double_arrow_both'] },
    'therefore': { latex: '\\therefore', features: ['therefore_symbol', 'three_dots'] },
    'because': { latex: '\\because', features: ['because_symbol', 'three_dots'] },
  },
  relations: {
    '<': { latex: '<', features: ['less_than', 'open_right'] },
    '>': { latex: '>', features: ['greater_than', 'open_left'] },
    'leq': { latex: '\\leq', features: ['less_equal', 'combined'] },
    'geq': { latex: '\\geq', features: ['greater_equal', 'combined'] },
    'neq': { latex: '\\neq', features: ['not_equal', 'slash_through'] },
    'approx': { latex: '\\approx', features: ['approximate', 'wavy'] },
    'equiv': { latex: '\\equiv', features: ['equivalent', 'three_lines'] },
    'cong': { latex: '\\cong', features: ['congruent', 'tilde_equals'] },
    'sim': { latex: '\\sim', features: ['similar', 'tilde'] },
    'propto': { latex: '\\propto', features: ['proportional', 'propto_symbol'] },
    'perp': { latex: '\\perp', features: ['perpendicular', 'right_angle'] },
    'parallel': { latex: '\\parallel', features: ['parallel_lines', 'two_vertical'] },
  },
  calculus: {
    'int': { latex: '\\int', features: ['integral', 's_shape'] },
    'iint': { latex: '\\iint', features: ['double_integral', 'two_s'] },
    'iiint': { latex: '\\iiint', features: ['triple_integral', 'three_s'] },
    'oint': { latex: '\\oint', features: ['contour_integral', 'circle_s'] },
    'sum': { latex: '\\sum', features: ['summation', 'greek_sigma'] },
    'prod': { latex: '\\prod', features: ['product', 'greek_pi'] },
    'lim': { latex: '\\lim', features: ['limit', 'letters'] },
    'inf': { latex: '\\infty', features: ['infinity', 'horizontal_8'] },
    'partial': { latex: '\\partial', features: ['partial_derivative', 'curved_d'] },
    'nabla': { latex: '\\nabla', features: ['nabla', 'inverted_triangle'] },
    'delta': { latex: '\\delta', features: ['delta', 'triangle'] },
    'Delta': { latex: '\\Delta', features: ['capital_delta', 'triangle'] },
    'epsilon': { latex: '\\epsilon', features: ['epsilon', 'curved_e'] },
    'pi': { latex: '\\pi', features: ['pi', 'greek_pi'] },
    'sigma': { latex: '\\sigma', features: ['sigma', 'greek_sigma'] },
    'Sigma': { latex: '\\Sigma', features: ['capital_sigma', 'greek_sigma'] },
    'theta': { latex: '\\theta', features: ['theta', 'theta_shape'] },
    'Theta': { latex: '\\Theta', features: ['capital_theta', 'theta_shape'] },
    'lambda': { latex: '\\lambda', features: ['lambda', 'lambda_shape'] },
    'mu': { latex: '\\mu', features: ['mu', 'mu_shape'] },
    'nu': { latex: '\\nu', features: ['nu', 'nu_shape'] },
    'xi': { latex: '\\xi', features: ['xi', 'xi_shape'] },
    'rho': { latex: '\\rho', features: ['rho', 'rho_shape'] },
    'tau': { latex: '\\tau', features: ['tau', 'tau_shape'] },
    'phi': { latex: '\\phi', features: ['phi', 'phi_shape'] },
    'Phi': { latex: '\\Phi', features: ['capital_phi', 'phi_shape'] },
    'psi': { latex: '\\psi', features: ['psi', 'psi_shape'] },
    'Psi': { latex: '\\Psi', features: ['capital_psi', 'psi_shape'] },
    'omega': { latex: '\\omega', features: ['omega', 'omega_shape'] },
    'Omega': { latex: '\\Omega', features: ['capital_omega', 'omega_shape'] },
  },
  radicals: {
    'sqrt': { latex: '\\sqrt{}', features: ['sqrt_symbol', 'check_mark'] },
    'cbrt': { latex: '\\sqrt[3]{}', features: ['cube_root', 'three_check'] },
  },
  fractions: {
    'frac': { latex: '\\frac{}{}', features: ['fraction_bar', 'horizontal_line'] },
  },
  exponents: {
    '^': { latex: '^{}', features: ['superscript', 'small_top'] },
    '_': { latex: '_{}', features: ['subscript', 'small_bottom'] },
  },
  arrows: {
    'leftarrow': { latex: '\\leftarrow', features: ['left_arrow', 'arrow_left'] },
    'rightarrow': { latex: '\\rightarrow', features: ['right_arrow', 'arrow_right'] },
    'leftrightarrow': { latex: '\\leftrightarrow', features: ['double_arrow', 'both_ways'] },
    'uparrow': { latex: '\\uparrow', features: ['up_arrow', 'arrow_up'] },
    'downarrow': { latex: '\\downarrow', features: ['down_arrow', 'arrow_down'] },
    'updownarrow': { latex: '\\updownarrow', features: ['vertical_double', 'both_ways'] },
  },
  parentheses: {
    '(': { latex: '(', features: ['left_paren', 'open_curve'] },
    ')': { latex: ')', features: ['right_paren', 'open_curve'] },
    '[': { latex: '[', features: ['left_bracket', 'square'] },
    ']': { latex: ']', features: ['right_bracket', 'square'] },
    '{': { latex: '\\{', features: ['left_brace', 'curly'] },
    '}': { latex: '\\}', features: ['right_brace', 'curly'] },
    '|': { latex: '|', features: ['vertical_bar', 'single_vertical'] },
    '||': { latex: '\\|', features: ['double_bar', 'two_vertical'] },
  },
  trigonometry: {
    'sin': { latex: '\\sin', features: ['trig_function', 'three_letters'] },
    'cos': { latex: '\\cos', features: ['trig_function', 'three_letters'] },
    'tan': { latex: '\\tan', features: ['trig_function', 'three_letters'] },
    'cot': { latex: '\\cot', features: ['trig_function', 'three_letters'] },
    'sec': { latex: '\\sec', features: ['trig_function', 'three_letters'] },
    'csc': { latex: '\\csc', features: ['trig_function', 'three_letters'] },
    'arcsin': { latex: '\\arcsin', features: ['inverse_trig', 'six_letters'] },
    'arccos': { latex: '\\arccos', features: ['inverse_trig', 'six_letters'] },
    'arctan': { latex: '\\arctan', features: ['inverse_trig', 'six_letters'] },
    'sinh': { latex: '\\sinh', features: ['hyperbolic', 'four_letters'] },
    'cosh': { latex: '\\cosh', features: ['hyperbolic', 'four_letters'] },
    'tanh': { latex: '\\tanh', features: ['hyperbolic', 'four_letters'] },
  },
  functions: {
    'log': { latex: '\\log', features: ['logarithm', 'three_letters'] },
    'ln': { latex: '\\ln', features: ['natural_log', 'two_letters'] },
    'exp': { latex: '\\exp', features: ['exponential', 'three_letters'] },
    'det': { latex: '\\det', features: ['determinant', 'three_letters'] },
    'min': { latex: '\\min', features: ['minimum', 'three_letters'] },
    'max': { latex: '\\max', features: ['maximum', 'three_letters'] },
    'sup': { latex: '\\sup', features: ['supremum', 'three_letters'] },
    'inf': { latex: '\\inf', features: ['infimum', 'three_letters'] },
    'arg': { latex: '\\arg', features: ['argument', 'three_letters'] },
    'mod': { latex: '\\mod', features: ['modulo', 'three_letters'] },
    'gcd': { latex: '\\gcd', features: ['gcd', 'three_letters'] },
    'lcm': { latex: '\\lcm', features: ['lcm', 'three_letters'] },
  },
  constants: {
    'e': { latex: 'e', features: ['euler', 'single_curve'] },
    'i': { latex: 'i', features: ['imaginary', 'dot_top'] },
    'pi': { latex: '\\pi', features: ['pi_constant', 'greek'] },
  },
  others: {
    '.': { latex: '.', features: ['dot', 'small'] },
    ',': { latex: ',', features: ['comma', 'small_hook'] },
    ':': { latex: ':', features: ['colon', 'two_dots'] },
    ';': { latex: ';', features: ['semicolon', 'dot_comma'] },
    '!': { latex: '!', features: ['exclamation', 'vertical_dot'] },
    '?': { latex: '?', features: ['question', 'curved_dot'] },
    '%': { latex: '\\%', features: ['percent', 'two_circles'] },
    '#': { latex: '\\#', features: ['number_sign', 'hash'] },
    '$': { latex: '\\$', features: ['dollar', 's_shape'] },
    '&': { latex: '\\&', features: ['ampersand', 'e_t'] },
    '@': { latex: '@', features: ['at_sign', 'circled_a'] },
  },
};

const SYMBOL_ALIASES = {
  'sqrt': ['sq', 'sqrt', 'srt', 'sqr'],
  'frac': ['frac', 'fr', 'fra'],
  'sum': ['sum', 'sigma'],
  'int': ['int', 'integral'],
  'pi': ['pi', 'pie'],
  'sin': ['sin', 's'],
  'cos': ['cos', 'c'],
  'tan': ['tan', 't'],
  'log': ['log', 'ln'],
  'exp': ['exp', 'e'],
  'lim': ['lim', 'limit'],
  'inf': ['inf', 'infinity', 'infty'],
  'times': ['times', 'x', 'mult'],
  'div': ['div', '/'],
  'partial': ['partial', 'del', 'd'],
  'nabla': ['nabla', 'grad'],
  'delta': ['delta', 'dlt'],
  'Delta': ['Delta', 'DLT'],
  'theta': ['theta', 'th'],
  'lambda': ['lambda', 'lam'],
  'sigma': ['sigma', 'sig'],
  'Sigma': ['Sigma', 'SIG'],
  'phi': ['phi', 'ph'],
  'Phi': ['Phi', 'PH'],
  'psi': ['psi', 'ps'],
  'Psi': ['Psi', 'PS'],
  'omega': ['omega', 'om'],
  'Omega': ['Omega', 'OM'],
  'exists': ['exists', 'ex'],
  'forall': ['forall', 'fa'],
  'implies': ['implies', '=>', '->'],
  'equiv': ['equiv', '=='],
  'approx': ['approx', '~'],
  'cong': ['cong', '~=', '=~'],
  'perp': ['perp', 'bot'],
  'parallel': ['parallel', '||'],
  'subset': ['subset', 'sub'],
  'supset': ['supset', 'sup'],
  'cap': ['cap', 'intersect'],
  'cup': ['cup', 'union'],
  'in': ['in', 'member'],
  'pm': ['pm', '+/-'],
  'mp': ['mp', '-/+'],
  'cdot': ['cdot', '*'],
  'ast': ['ast', 'star'],
  'circ': ['circ', 'o'],
  'oplus': ['oplus', '+o'],
  'ominus': ['ominus', '-o'],
  'otimes': ['otimes', 'xo'],
  'oslash': ['oslash', '/o'],
  'leq': ['leq', '<=', '<'],
  'geq': ['geq', '>=', '>'],
  'neq': ['neq', '!=', '<>'],
  'propto': ['propto', 'prop'],
};

const SymbolRecognizer = {
  getAllSymbols: () => {
    const allSymbols = [];
    Object.keys(SYMBOLS).forEach(category => {
      Object.keys(SYMBOLS[category]).forEach(key => {
        allSymbols.push({
          key,
          latex: SYMBOLS[category][key].latex,
          features: SYMBOLS[category][key].features,
          category
        });
      });
    });
    return allSymbols;
  },

  getByCategory: (category) => {
    if (SYMBOLS[category]) {
      return Object.keys(SYMBOLS[category]).map(key => ({
        key,
        latex: SYMBOLS[category][key].latex,
        features: SYMBOLS[category][key].features,
        category
      }));
    }
    return [];
  },

  getCategoryNames: () => Object.keys(SYMBOLS),

  getSymbolByKey: (key) => {
    for (const category of Object.keys(SYMBOLS)) {
      if (SYMBOLS[category][key]) {
        return {
          key,
          latex: SYMBOLS[category][key].latex,
          features: SYMBOLS[category][key].features,
          category
        };
      }
    }
    return null;
  },

  getSymbolByAlias: (alias) => {
    const lowerAlias = alias.toLowerCase().trim();
    
    for (const [symbolKey, aliases] of Object.entries(SYMBOL_ALIASES)) {
      if (aliases.includes(lowerAlias)) {
        return this.getSymbolByKey(symbolKey);
      }
    }
    return null;
  },

  suggestSymbols: (input) => {
    const suggestions = [];
    const lowerInput = input.toLowerCase().trim();
    
    if (!lowerInput) return suggestions;
    
    for (const [symbolKey, aliases] of Object.entries(SYMBOL_ALIASES)) {
      for (const alias of aliases) {
        if (alias.startsWith(lowerInput)) {
          const symbol = this.getSymbolByKey(symbolKey);
          if (symbol) {
            suggestions.push({
              symbol: symbol.key,
              latex: symbol.latex,
              category: symbol.category,
              alias: alias,
              matchLength: lowerInput.length
            });
          }
          break;
        }
      }
    }
    
    suggestions.sort((a, b) => a.matchLength - b.matchLength);
    
    return suggestions.slice(0, 5);
  },

  detectMultiCharSymbols: (recognizedSymbols) => {
    const result = [];
    let i = 0;
    
    while (i < recognizedSymbols.length) {
      const current = recognizedSymbols[i];
      let matched = false;
      
      if (i + 1 < recognizedSymbols.length) {
        const twoChar = current.symbol + recognizedSymbols[i + 1].symbol;
        const suggestion = this.suggestSymbols(twoChar);
        
        if (suggestion.length > 0) {
          result.push({
            symbol: suggestion[0].symbol,
            latex: suggestion[0].latex,
            category: suggestion[0].category,
            confidence: 95
          });
          i += 2;
          matched = true;
        }
      }
      
      if (!matched) {
        result.push(current);
        i++;
      }
    }
    
    return result;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SYMBOLS, SymbolRecognizer };
}