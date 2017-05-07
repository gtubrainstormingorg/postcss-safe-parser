import tokenizer from 'postcss/lib/tokenize';
import Comment   from 'postcss/lib/comment';
import Parser    from 'postcss/lib/parser';

export default class SafeParser extends Parser {

    createTokenizer() {
        this.tokenizer = tokenizer(this.input, { ignoreErrors: true });
    }

    comment(token) {
        let node = new Comment();
        this.init(node, token[2], token[3]);
        node.source.end = { line: token[4], column: token[5] };

        let text = token[1].slice(2);
        if ( text.slice(-2) === '*/' ) text = text.slice(0, -2);

        if ( /^\s*$/.test(text) ) {
            node.text       = '';
            node.raws.left  = text;
            node.raws.right = '';
        } else {
            let match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);
            node.text       = match[2];
            node.raws.left  = match[1];
            node.raws.right = match[3];
        }
    }

    decl(tokens) {
        if ( tokens.length > 1 || tokens[0][0] !== ':' ) {
            super.decl(tokens);
        }
    }

    unclosedBracket() { }

    unknownWord(tokens) {
        this.spaces += tokens.map(i => i[1]).join('');
    }

    unexpectedClose() {
        this.current.raws.after += '}';
    }

    doubleColon() { }

    unnamedAtrule(node) {
        node.name = '';
    }

    precheckMissedSemicolon(tokens) {
        let colon = this.colon(tokens);
        if ( colon === false ) return;

        let split;
        for ( split = colon - 1; split >= 0; split-- ) {
            if ( tokens[split][0] === 'word' ) break;
        }
        for ( split -= 1; split >= 0; split-- ) {
            if ( tokens[split][0] !== 'space' ) {
                split += 1;
                break;
            }
        }
        let other = tokens.splice(split, tokens.length - split);
        this.decl(other);
    }

    checkMissedSemicolon() { }

    endFile() {
        if ( this.current.nodes && this.current.nodes.length ) {
            this.current.raws.semicolon = this.semicolon;
        }
        this.current.raws.after = (this.current.raws.after || '') + this.spaces;

        while ( this.current.parent ) {
            this.current = this.current.parent;
            this.current.raws.after = '';
        }
    }

}
