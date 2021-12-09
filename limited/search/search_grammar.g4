grammar search_grammar;


start : operation EOF;


operation :
    '!' operation #Not
    | '(' operation ')' #Parenthesis
    | restriction #RestrictionOperation
    | operation operation #And
    | operation '&' operation #And
    | operation '||' operation #Or
;

restriction :
    value #CardRestriction
    | PRINTING_CODE ':' value #CardRestriction
    | NAME_CODE subset_operator value #NameRestriction
    | CREATOR_CODE subset_operator value #CreatorRestriction
    | WINS_CODE comparison_operator UNSIGNED_INTEGER #WinsRestriction
    | LOSSES_CODE comparison_operator UNSIGNED_INTEGER #LossesRestriction
    | DRAWS_CODE comparison_operator UNSIGNED_INTEGER #DrawsRestriction
    | CUBE_CODE subset_operator value #CubeRestriction
;

value :
    VALUE #InferredValue
    | QUOTED_VALUE #QuotedValue
    | UNSIGNED_INTEGER #UnsignedIntegerValue
;

subset_operator:
    '=' #ExactOperator
    | ':' #InOperator
;

comparison_operator:
    '=' #EqualsOperator
    | '<' #LessThanOperator
    | '<=' #LessEqualOperator
    | '>' #GreaterThanOperator
    | '>=' #GreaterEqualOperator
;

PRINTING_CODE: [pP];
NAME_CODE: [nN];
CREATOR_CODE: [cC];
WINS_CODE: [wW];
LOSSES_CODE: [lL];
DRAWS_CODE: [dD];
CUBE_CODE: [uU];

UNSIGNED_INTEGER : [0-9]+;

QUOTED_VALUE : '['~(']')*']';
VALUE : [a-zA-Z0-9\-';_âáéàíúöû]+;

WHITESPACE : [ \n\t\r] -> skip;
