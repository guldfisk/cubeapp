import React from "react";
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";


interface SearchLinkProps {
  query: string
}


const SearchLink: React.FunctionComponent<SearchLinkProps> = (
  {query}: SearchLinkProps
) => {
  return <a
    href={"/search/?query=" + query}
  >
    {query}
  </a>
};


const SearchSyntaxPage: React.FunctionComponent = () =>
  <Container>
    <h3>Index</h3>
    <ul>
      <li><a href="#operators">How works</a></li>
      <li>
        Searchable fields
        <ul>
          <li><a href="#name">Name</a></li>
          <li><a href="#type">Type</a></li>
          <li><a href="#manacost">Manacost</a></li>
          <li><a href="#color">Color</a></li>
          <li><a href="#oracle">Oracle Text</a></li>
          <li><a href="#power">Power</a></li>
          <li><a href="#toughness">Toughness</a></li>
          <li><a href="#loyalty">Loyalty</a></li>
          <li><a href="#artist">Artist</a></li>
          <li><a href="#cmc">Converted Mana Cost</a></li>
          <li><a href="#rarity">Rarity</a></li>
          <li><a href="#layout">Layout</a></li>
          {/*<li><a href="#flavor">Flavor</a></li>*/}
          <li><a href="#expansion">Expansion</a></li>
          <li><a href="#block">Block</a></li>
        </ul>
      </li>
    </ul>

    <h4 id="operators">How Works</h4>
    <p>Searches are done using a series of filters, that consist of a code, an operator, and a value. The code
      determines what to filter on, the operator how the filtering operation takes place, and the value what is compared
      against.</p>
    <p>So "cmc{">"}3" has code "cmc", operator "{">"}" and value "3", which means all cards with a converted mana cost less than
      3.</p>
    <p>{'The legal operators are: "=", "<", ">", "<=", ">=" and ";"'}</p>
    <p>They all behave like they usually do, except for ";" that means "contains", so "o;xd" means "cards with `xd` in
      their oracle text".</p>
    <p>Usual logic operations are also available. Chaining of filters implies an and-operation.</p>
    <Table>
      <thead>
      <tr>
        <th>Operator</th>
        <th>Function</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>||</td>
        <td>or</td>
      </tr>
      <tr>
        <td>&</td>
        <td>and</td>
      </tr>
      <tr>
        <td>!</td>
        <td>not</td>
      </tr>
      <tr>
        <td>()</td>
        <td>parenthesis</td>
      </tr>
      </tbody>
    </Table>
    <p>So <SearchLink query="((cmc>2 po<=2 m>2r m<4r t;hum) || m={u/w}) f !t;soldi"/> is a legal query.</p>
    <p>Use quotes ("") to explicitly define something as a value. This is useful to search for reserved codes, such as
      "artist", or for providing values with spaces.</p>

    <h4 id="name">Name</h4>
    <p>code: n</p>
    <p>This is the default search field, so the n code is rarely needed. It is always case-insensitive.</p>
    <p>Example: <SearchLink query="web"/></p>
    <p>Find all cards where the name contains "web"</p>
    <p>Example: <SearchLink query="n=web"/></p>
    <p>Find all cards where the name is exactly "web"</p>

    <h4 id="type">Type</h4>
    <p>code: t</p>
    <p>Input a space separated sequence of type values. A value does not have to an exact type, but it has to
      unambiguously match only a single type (so "cr" is not not allowed, but "crea" is).</p>
    <p>All types of types are treated equally, this field searches for both super-types, types and sub-types. Order is
      irrelevant.</p>
    <p>Example: <SearchLink query="t;crea"/></p>
    <p>All cards with the type "creature"</p>
    <p>Example: <SearchLink query="t;crea huma"/></p>
    <p>All cards with the type "creature" and "human"</p>
    <p>Example: <SearchLink query="t=crea artifa constr"/></p>
    <p>All cards with the exact types "Artifact Creature - Construct</p>
    <p>Example: <SearchLink query="t;sorc n;hum"/></p>
    <p>All cards with the sype "sorcery" and "hum" in the name. This could also be achived with "hum t;sorc"</p>

    <h4 id="manacost">Manacost</h4>
    <p>code: m</p>
    <p>Mana symbol codes</p>
    <Table>
      <thead>
      <tr>
        <th>Code</th>
        <th>Mana Symbol</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>w</td>
        <td>White</td>
      </tr>
      <tr>
        <td>u</td>
        <td>Blue</td>
      </tr>
      <tr>
        <td>b</td>
        <td>Black</td>
      </tr>
      <tr>
        <td>r</td>
        <td>Red</td>
      </tr>
      <tr>
        <td>g</td>
        <td>Green</td>
      </tr>
      <tr>
        <td>c</td>
        <td>Colorless</td>
      </tr>
      <tr>
        <td>s</td>
        <td>Snow</td>
      </tr>
      <tr>
        <td>{"any number n"}</td>
        <td>n generic</td>
      </tr>
      <tr>
        <td>{"{symbol/other_symbol}"}</td>
        <td>Hybrid between symbol and other_symbol</td>
      </tr>
      </tbody>
    </Table>
    <p>Order never matters. For now, ";" operator doesn't work here, since a manacost does not contain another manacost,
      use "{">"}=" instead.</p>
    <p>Example: <SearchLink query="m>=2r"/></p>
    <p>Cards with a manacost containing two generic and one red.</p>
    <p>Example: <SearchLink query="m=2rr2"/></p>
    <p>Cards with an exact manacost of four generic and two red.</p>
    <p>Example: <SearchLink query="m<{u/w}2 m>={w/u}"/></p>
    <p>Cards with a mana cost of one w/u and up to two generic.</p>
    <p>Example: <SearchLink query="m={2/r}{2/r}{2/r}"/></p>
    <p>Flame javelin.</p>

    <h4 id="color">Color</h4>
    <p>code: color</p>
    <p>Color codes</p>
    <Table>
      <thead>
      <tr>
        <th>Code</th>
        <th>Color</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>w</td>
        <td>White</td>
      </tr>
      <tr>
        <td>u</td>
        <td>Blue</td>
      </tr>
      <tr>
        <td>b</td>
        <td>Black</td>
      </tr>
      <tr>
        <td>r</td>
        <td>Red</td>
      </tr>
      <tr>
        <td>g</td>
        <td>Green</td>
      </tr>
      </tbody>
    </Table>
    <p>Order never matters. For now, ";" operator doesn't work here, since a color set does not contain another color
      set, use "{">"}=" instead.</p>
    <p>Example: <SearchLink query="color>ur"/></p>
    <p>All cards that are more colors than blue and red.</p>
    <p>Example: <SearchLink query="color=b"/></p>
    <p>All black cards that are no other colors</p>
    <p>Example: <SearchLink query="color<g"/></p>
    <p>All colorsless cards</p>

    <h4 id="oracle">Oracle Text</h4>
    <p>code: o</p>
    <p>Case-insensitive search of a cards oracle text.</p>
    <p>Example: <SearchLink query="o;trample"/></p>
    <p>All cards with "trample" in their oracle text.</p>
    <p>Example: <SearchLink query="o=flying"/></p>
    <p>All vanilla creatures with flying.</p>

    <h4 id="power">Power</h4>
    <p>code: po</p>
    <p>Filter cards power.</p>
    <p>Example: <SearchLink query="po=3"/></p>
    <p>All cards with power 3.</p>
    <p>Example: <SearchLink query="po>9"/></p>
    <p>All cards with power greater than nine.</p>

    <h4 id="tough">Toughness</h4>
    <p>code: toughness</p>
    <p>Filter cards toughness.</p>
    <p>Example: <SearchLink query="tough=3"/></p>
    <p>All cards with toughness 3.</p>
    <p>Example: <SearchLink query="tough>9"/></p>
    <p>All cards with toughness greater than nine.</p>

    <h4 id="loyalty">Loyalty</h4>
    <p>code: loyalty</p>
    <p>Filter cards loyalty.</p>
    <p>Example: <SearchLink query="loyalty=3"/></p>
    <p>All cards with loyalty 3.</p>
    <p>Example: <SearchLink query="loyalty>9"/></p>
    <p>All cards with loyalty greater than nine.</p>

    <h4 id="artist">Artist</h4>
    <p>code: artist</p>
    <p>Filter for artist name. Case-insensitive.</p>
    <p>Example: <SearchLink query="artist;avon"/></p>
    <p>All cards drawn by an artist with "avon" in their name.</p>
    <p>Example: <SearchLink query='artist="john avon"'/></p>
    <p>All cards drawn by John Avon</p>

    <h4 id="cmc">Converted Mana Cost</h4>
    <p>code: cmc</p>
    <p>Filter on card converted manacost.</p>
    <p>Example: <SearchLink query="cmc=2"/></p>
    <p>All cards with converted manacost 2.</p>
    <p>Example: <SearchLink query="cmc<4"/></p>
    <p>All cards with converted manacost less than 4.</p>

    <h4 id="rarity">Rarity</h4>
    <p>code: rarity</p>
    <p>Supported rarities are: "common", "uncommon", "rare", "mythic". Can only use equals operator.</p>
    <p>Example: <SearchLink query="rarity=rare"/></p>
    <p>All rares.</p>

    <h4 id="layout">Layout</h4>
    <p>code: layout</p>

    {/*<h4 id="flavor">Flavor</h4>*/}
    {/*<p>code: flavor</p>*/}

    <h4 id="expansion">Expansion</h4>
    <p>code: e</p>
    <p>Search for expansion using three-letter code.</p>

    <h4 id="block">Block</h4>
    <p>code: block</p>
    <p>Search for block using soft match of name etc.</p>

  </Container>
;

export default SearchSyntaxPage;