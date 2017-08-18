/// <reference path="db.ts" />
/// <reference path="types.ts" />

const LandAny = Types.LandAny;
type Card = Types.Card;

const CARDS = DB.CARDS;

document.addEventListener("DOMContentLoaded", () => {
    const search = <HTMLInputElement> document.getElementById("search");
    const sort = <HTMLSelectElement> document.getElementById("sort");
    const order = <HTMLDivElement> document.getElementById("arrow");

    search.oninput = _ => update();
    sort.onchange = _ => update();
    order.onclick = _ => {
        order.classList.toggle("rotated");
        update();
    };

    update();

});

function update() {
    const search = <HTMLInputElement> document.getElementById("search");
    const result = <HTMLParagraphElement> document.getElementById("result");
    const sort = <HTMLSelectElement> document.getElementById("sort");
    const order = <HTMLDivElement> document.getElementById("arrow");

    // clear old content
    while (result.firstChild) {
        result.removeChild(result.firstChild);
    }

    let searchstring = search.value.toLowerCase();
    let sortby = sort.value.toLowerCase();
    let ascending = !order.classList.contains("rotated");
    let cards = CARDS;

    [cards, searchstring] = filter(cards, searchstring, "type");
    [cards, searchstring] = filter(cards, searchstring, "cost");
    [cards, searchstring] = filter(cards, searchstring, "name");
    [cards, searchstring] = filter(cards, searchstring, "speed");
    [cards, searchstring] = filter(cards, searchstring, "range");
    [cards, searchstring] = filter(cards, searchstring, "target");
    [cards, searchstring] = filter(cards, searchstring, "elements");
    [cards, searchstring] = filter(cards, searchstring, "description");

    let groups = searchgroups(searchstring);

    cards = cards.filter(e => {
        let contains = true;
        for (const word of groups) {
            contains = contains && e.toSearchString().toLowerCase().indexOf(word) >= 0;
        }
        return contains;
    });
    cards = cards.sort((a, b) => {
        let propa = (a as any)[sortby];
        let propb = (b as any)[sortby];
        let st = ascending ? -1 : 1;
        let gt = ascending ? 1 : -1;
        return propa === propb ? 0 : (propa < propb ? st : gt);
    });
    for (const card of cards) {
        let flex = <HTMLDivElement> document.createElement("div");
        flex.classList.add("flex-50", "xs-flex-33", "sm-flex-25", "md-flex-20", "l-flex-15", "xl-flex-12", "xxl-flex-10");
        flex.appendChild(card.toCard());
        result.appendChild(flex);
    }

    // add a few extra to make sure that the trailing line is full as well
    for (let i = 0; i < 10; i++) {
        let flex = <HTMLDivElement> document.createElement("div");
        flex.classList.add("flex-50", "xs-flex-33", "sm-flex-25", "md-flex-20", "l-flex-15", "xl-flex-12", "xxl-flex-10");
        flex.style.height = "0px";
        result.appendChild(flex);
    }

    // scale font of cardbacks to fit size
    let ps = document.getElementsByClassName("backtext");
    for (let i = 0; i < ps.length; i++) {
        let p = <HTMLSpanElement> ps[i];
        let fontsize = 16;
        p.style.fontSize = fontsize + "px";
        let back = (p.parentElement as any).parentElement as any;
        while (p.offsetHeight > back.offsetHeight) {
            fontsize -= 0.5;
            p.style.fontSize = fontsize + "px";
        }
    }
}


function getFilter(search: string, name: string): [string | null, string, number | null] {
    let idx = search.indexOf(name + ":");
    if (idx >= 0) {
        let start = idx + name.length + 1;
        let end;
        let rest_off;
        if (search[start] == '"') {
            start += 1;
             end = search.indexOf('"', start);
             rest_off = 2;
        } else {
            end = search.indexOf(' ', start);
            rest_off = 1;
        }
        if (end == -1) {
            end = search.length;
        }
        return [search.substring(start, end), search.substring(0, idx) + search.substring(end + rest_off, search.length), idx];
    }
    return [null, search, null];
}

function propToString(prop: any) {
    if (prop == LandAny) {
        return "Any (" + prop.toString() + ")";
    }
    return prop.toString();
}

function filter(cards: Card[], searchstring: string, property: string): [Card[], string] {
    let filter: string | null = "";
    let search: string = searchstring;
    while (filter != null) {
        [filter, search] = getFilter(search, property);
        if (filter != null) {
            let filterString = filter as string;
            cards = cards.filter(c => {
                let prop = (c as any)[property];
                if (prop == null) {
                    return false;
                }
                if (filterString.indexOf("<=") == 0) {
                    return prop <= filterString.substring(2);
                } else if (filterString.indexOf(">=") == 0) {
                    return prop >= filterString.substring(2);
                } else if (filterString.indexOf("<") == 0) {
                    return prop < filterString.substring(1);
                } else if (filterString.indexOf(">") == 0) {
                    return prop > filterString.substring(1);
                }
                return propToString((c as any)[property]).toLowerCase().indexOf(filter) >= 0;
            });
        }
    }
    return [cards, search];
}

function searchgroups(search: string): string[] {
    let res = [];
    while (search.indexOf('"') >= 0) {
        let start = search.indexOf('"');
        let end = search.indexOf('"', start + 1);
        if (end == -1) {
            end = search.length;
        }
        res.push(search.substring(start + 1, end));
        search = search.substring(0, start) + search.substring(end+1);
    }
    res = res.concat(search.split(" "));
    return res;
}
