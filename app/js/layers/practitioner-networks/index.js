// ─────────────────────────────────────────────────────────────
//  PRACTITIONER NETWORKS
//
//  The Pocket Project's Practice Groups, Resilience Circles, Integration
//  Labs and Witnessing Hubs, drawn over the globe.
//
//  Written to the standard layer contract so it can be mounted two ways:
//    - by the embedded practitioner map (practitioner.html), which boots the
//      globe engine plus this one layer
//    - by the Atlas itself, by adding this path to its layer list
//
//  Nothing here knows which host it is running in.
//
//  Shape says what kind of claim the marker makes, fill says whether anyone
//  actually gathers there. Neither depends on colour:
//
//    circle    a city
//    diamond   a country rather than a place in it: either a group open to
//              the whole country, or one whose subject is that country.
//              Both meet online, and the country is tinted underneath.
//    tint only a region: every country in it is shaded and outlined, with no
//              marker, because a region has no centre worth pointing at
//    none      no place at all; these live in the side list
//
//    solid     you could go there
//    hollow    nobody gathers at this point: either online and merely hosted
//              from this city, or a subject with no venue
//
//  Two earlier attempts drew areas instead, and both were wrong the same way.
//  A retired "regional" scale put a fixed 9 degree disc around a group's own
//  city, and field_country groups got the same disc over their country. A
//  circle of arbitrary radius is a guess wearing the costume of data: over
//  Lebanon it was mostly sea, and over Europe several merged into one bruise
//  that hid the markers beneath. A country's own outline is exact and already
//  on the map, so tinting it invents nothing. See DECISIONS.md.
// ─────────────────────────────────────────────────────────────

const NETWORKS = [
  { key: 'practice_groups',    label: 'Practice Groups',    color: '#E8772C' },
  { key: 'resilience_circles', label: 'Resilience Circles', color: '#3F9991' },
  { key: 'integration_labs',   label: 'Integration Labs',   color: '#7a3b5d' },
  { key: 'witnessing_hubs',    label: 'Witnessing Hubs',    color: '#84AFAA' },
];
const BY_KEY = Object.fromEntries(NETWORKS.map((n) => [n.key, n]));

const MARKER_R = 6;
const CLUSTER_R = 11;

// Past this zoom a continental group also shows the place it is actually run
// from. Zoomed out, "Africa" is the honest answer and a dot in Berlin would be
// noise; zoomed in, "Africa, run from Berlin" is the honest answer and the
// shading alone starts to look like a claim about a continent. Neither reading
// is wrong, they just belong at different distances.
const ZOOM_SHOW_ANCHOR = 2.2;

export default {
  id: 'practitioner-networks',
  label: 'Practitioner Networks',
  group: 'entanglement',          // stacks rather than replacing the surface fill
  methodologyPath: 'methodology/practitioner-networks.md',
  dataPath: 'data/practitioner_groups.json',

  controls: [
    { id: 'practice_groups',    label: 'Practice Groups',    type: 'toggle', default: true },
    { id: 'resilience_circles', label: 'Resilience Circles', type: 'toggle', default: true },
    { id: 'integration_labs',   label: 'Integration Labs',   type: 'toggle', default: true },
    { id: 'witnessing_hubs',    label: 'Witnessing Hubs',    type: 'toggle', default: true },
    { id: 'tint', label: 'Tint countries by group count', type: 'toggle', default: true },
  ],

  // The host may pass extra behaviour through: onSelect to open a drawer,
  // countryFilter to narrow to one country, details for the richer text.
  render(ctx) {
    const opts = ctx.options || {};
    const all = (ctx.data && ctx.data.groups) ? ctx.data.groups : [];

    const gMarks = ctx.group.append('g').attr('class', 'pn-marks');

    let selectedId = null;
    let selectedCluster = null;

    const colorOf = (g) => (BY_KEY[g.network] || {}).color || 'var(--accent)';

    function activeKeys() {
      const on = NETWORKS.map((n) => n.key).filter((k) => {
        const v = ctx.getControl(k);
        return v == null ? true : !!v;
      });
      return new Set(opts.activeNetworks ? [...opts.activeNetworks] : on);
    }

    // A group with a field_country is about a place without meeting in one: an
    // Integration Lab on Lebanon runs on a video call across timezones, yet
    // Lebanon is plainly its subject. Those tint the country and take a diamond
    // at its centre. Everything without one keeps its own scale, and stays in
    // the side list if it has no place at all.
    // Read from scope, which is the field that actually means "how far does
    // this reach". scale is kept only so a row written before the split still
    // renders.
    const scopeOf = (g) => g.scope || g.scale || 'global';
    const fieldIso = (g) => (scopeOf(g) === 'national' && g.field_iso3) ? g.field_iso3 : null;
    const isField = (g) => !!fieldIso(g);

    // A region is a named list of real countries, not a circle. Africa is its
    // 55 states; Latin America is its 23. Every one of them is tinted and the
    // whole region carries a heavier outline so it reads as one area at a
    // glance. Nothing is invented: the borders are the basemap's own.
    const REGIONS = opts.regions || {};
    const fieldRegion = (g) => (scopeOf(g) === 'continental' && g.field_region
      && REGIONS[g.field_region]) ? g.field_region : null;
    const isRegion = (g) => !!fieldRegion(g);
    const regionCountries = (key) => (REGIONS[key] && REGIONS[key].countries) || [];

    function inScope() {
      const nets = activeKeys();
      const iso3 = opts.countryFilter || null;
      const extra = opts.extraFilter || null;
      return all.filter((g) => {
        if (g.visible === false) return false;
        if (!nets.has(g.network)) return false;
        // Status and language filters live in the host, because they are about
        // the words in a row rather than about geography.
        if (extra && !extra(g)) return false;
        if (!iso3) return true;
        // A country filter keeps groups that meet there, groups about there,
        // and groups about a region that contains it.
        if (g.iso3 === iso3 || g.field_iso3 === iso3) return true;
        if (isRegion(g) && regionCountries(g.field_region).includes(iso3)) return true;
        // Groups with no place at all stay in the list rather than vanishing.
        return scopeOf(g) === 'global';
      });
    }

    // ── on a globe, anything past the horizon must not be drawn, or markers
    // bleed through the earth. In flat mode everything faces the viewer.
    function facing(lon, lat) {
      if (ctx.globe.getProjection() > 0.5) return true;
      const r = ctx.projection.rotate();
      return d3.geoDistance([lon, lat], [-r[0], -r[1]]) < Math.PI / 2;
    }

    function anchorOf(g) {
      if (g.scale === 'national' && g.iso3) {
        const c = ctx.getCentroids()[g.iso3];
        if (c) return c;
      }
      if (g.lng != null && g.lat != null) return [g.lng, g.lat];
      return g.iso3 ? (ctx.getCentroids()[g.iso3] || null) : null;
    }

    // Groups sharing a point become one marker. A group about a country sits at
    // that country's centre, and is kept in its own cluster rather than merged
    // with anything that meets there: "three labs about Germany" and "a group
    // meeting in Berlin" are different claims and must not share a dot.
    function clusters(groups) {
      const by = new Map();
      const zoom = ctx.globe.getZoom ? ctx.globe.getZoom() : 1;
      for (const g of groups) {
        if (isRegion(g)) {
          // Zoomed out the shading says it all. Zoomed in, show where the group
          // is actually run from, if the data says. Marked so it can be drawn
          // and labelled differently from a group that meets there.
          if (zoom < ZOOM_SHOW_ANCHOR || !g.anchor_iso3) continue;
          const a = (g.lng != null && g.lat != null)
            ? [g.lng, g.lat] : ctx.getCentroids()[g.anchor_iso3];
          if (!a) continue;
          const key = `anchor:${a[0].toFixed(2)},${a[1].toFixed(2)}`;
          let c = by.get(key);
          if (!c) {
            c = { key, lon: a[0], lat: a[1], iso3: g.anchor_iso3,
                  about: false, anchor: true, members: [] };
            by.set(key, c);
          }
          c.members.push(g);
          continue;
        }
        const field = isField(g);
        if (scopeOf(g) === 'global' && !field) continue;
        const a = field ? (ctx.getCentroids()[fieldIso(g)] || null) : anchorOf(g);
        if (!a) continue;
        const key = `${field ? 'about:' : 'at:'}${a[0].toFixed(2)},${a[1].toFixed(2)}`;
        let c = by.get(key);
        if (!c) {
          c = { key, lon: a[0], lat: a[1], iso3: field ? fieldIso(g) : g.iso3,
                about: field, members: [] };
          by.set(key, c);
        }
        c.members.push(g);
      }
      return [...by.values()];
    }

    function paint() {
      if (!ctx.setPaint) return;
      if (ctx.getControl('tint') === false) { ctx.setPaint(null); return; }
      // "Related to" rather than "meets in", so a Lab enquiring into a country
      // counts towards its tint just as a group meeting there does.
      const counts = {};
      const inRegion = new Set();
      for (const g of scope().scoped) {
        if (isRegion(g)) {
          // Every country in the region is tinted, and marked so it can also
          // take the heavier outline. A region counts once per country, not
          // once overall, so a country inside two regions reads as denser.
          for (const c of regionCountries(g.field_region)) {
            counts[c] = (counts[c] || 0) + 1;
            inRegion.add(c);
          }
          continue;
        }
        const iso = isField(g) ? g.field_iso3 : g.iso3;
        if (!iso) continue;
        counts[iso] = (counts[iso] || 0) + 1;
      }
      opts.onRegionCountries?.(inRegion);
      const max = Math.max(1, ...Object.values(counts));
      // The lightest step used to be #f0dcc4, which sat 0.006 in lightness from
      // the ocean's #eadfcd. A country with one group was indistinguishable
      // from sea. Kosha asked for it to come up about 15 percent on 27 August.
      // Raised in saturation rather than lightness: a paler colour would have
      // disappeared into the page instead, and the gap that matters here is
      // chroma. Lightness gap now 0.057, saturation gap 0.512.
      const ramp = d3.scaleLinear().domain([1, max])
        .range(['#FBD19F', '#E8A96B']).interpolate(d3.interpolateRgb).clamp(true);
      ctx.setPaint((iso3) => (counts[iso3] ? ramp(counts[iso3]) : null));
    }

    // Two things are encoded at once, and they answer different questions.
    //
    //   shape  = the kind of claim: city, country, or subject.
    //   fill   = whether the group actually meets in that place.
    //
    // Solid means you could go there. Hollow means the group is online and the
    // marker is only where it is hosted from, usually a facilitator's city.
    // Half the placed groups are online, so without this the map would be
    // telling visitors there is something to attend in a town where there is
    // not. The legend explains the distinction; the shapes carry it.
    const meetsHere = (g) => g.format !== 'online';

    // NOTE ON .style() RATHER THAN .attr()
    //
    // Fill and stroke are set as inline styles here, deliberately. Setting them
    // with .attr() writes an SVG *presentation attribute*, which sits below
    // every CSS rule in the cascade. The stylesheet already carries
    // `.pn-marker .pn-dot { stroke: var(--bg) }`, so an attribute-set stroke is
    // silently discarded: a hollow marker came out bone on bone and vanished
    // against the landmass. Inline style outranks the rule and holds.
    // "Open to a whole country" and "about this country" were two legend lines
    // for what a visitor reads as one thing: a marker at a country's centre
    // rather than at a place you could go. Kosha asked to merge them on
    // 27 August. Most of the national group were an artefact anyway: five of
    // the eight named a city in their own title and simply had an empty city
    // column, and those are now placed properly. Three genuinely country-wide
    // groups remain and take the same diamond.
    const isCountryLevel = (g, about) => about || scopeOf(g) === 'national';

    function shape(sel, g, r, about, anchor) {
      // The root of a continental group: a small hollow circle with a ring
      // around it, so it reads as "this is where it is run from" rather than
      // as another meeting place.
      if (anchor) {
        const c = colorOf(g);
        sel.append('circle').attr('class', 'pn-dot').attr('r', r)
          .style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', '2px');
        sel.append('circle').attr('r', r + 3.5)
          .style('fill', 'none').style('stroke', c)
          .style('stroke-width', '1px').style('stroke-opacity', '.45');
        return;
      }
      const solid = meetsHere(g);
      const c = colorOf(g);
      // "About this place" gets a diamond: a third shape, so it is never
      // mistaken for somewhere a meeting happens. Hollow, because nobody
      // gathers here. The country tint carries the geography; this only says
      // which country the subject belongs to.
      if (isCountryLevel(g, about)) {
        sel.append('rect').attr('class', 'pn-dot')
          .attr('x', -r).attr('y', -r).attr('width', r * 2).attr('height', r * 2)
          .attr('transform', 'rotate(45)')
          .style('fill', 'var(--bg)').style('stroke', c).style('stroke-width', '2.4px');
        return;
      }
      // Everything else is a place: a circle, filled if people gather there.
      // The rounded square that used to mean "national" is gone with the
      // merge above; national groups take the diamond now.
      sel.append('circle').attr('class', 'pn-dot').attr('r', r)
        .style('fill', solid ? c : 'var(--bg)')
        .style('stroke', c)
        .style('stroke-width', solid ? '1.5px' : '2.4px');
    }

    // ── drawing ────────────────────────────────────────────────
    //
    // Markers are built once and then only moved. draw() runs on every frame
    // of every rotation, and the first version rebuilt the whole marker layer
    // each time: about 190 SVG nodes destroyed and recreated, roughly 11,000
    // per second while the globe turned. That is not merely slow. The node
    // under the cursor was destroyed mid-hover, so tooltips flickered and a
    // click could land on an element that no longer existed, which is what
    // "laggy and buggy" actually was.
    //
    // Now: cluster membership is computed only when the filters change, the
    // nodes are joined by key so they persist, and per frame the only work is
    // a transform and a visibility flag on each.

    let cache = null;      // { scoped, clusters } for the current filters
    let joined = false;    // have the DOM nodes been matched to that cluster set

    function scope() {
      if (!cache) {
        const scoped = inScope();
        cache = { scoped, clusters: clusters(scoped) };
        opts.onScopeChange?.(scoped);
      }
      return cache;
    }

    // Anything that changes which groups are shown, as opposed to where they
    // are on screen, has to call this. Rotation and zoom must not.
    function invalidate() { cache = null; joined = false; }

    // Crossing the anchor threshold changes which markers exist, so the cluster
    // set has to be rebuilt. Every other zoom change is just a reprojection and
    // must not invalidate anything.
    let lastDetail = null;
    function checkZoomDetail() {
      const zoom = ctx.globe.getZoom ? ctx.globe.getZoom() : 1;
      const detail = zoom >= ZOOM_SHOW_ANCHOR;
      if (detail !== lastDetail) { lastDetail = detail; invalidate(); }
    }

    function buildNode(sel, c) {
      const many = c.members.length > 1;
      const hit = sel.append('g')
        .attr('class', many ? 'pn-clusternode' : 'pn-marker')
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', many
          ? (c.about
              ? `${c.members.length} groups about ${c.members[0].country || 'this country'}`
              : `${c.members.length} groups in ${c.members[0].city || c.members[0].country || 'this place'}`)
          : c.members[0].name);

      if (many) {
        // Solid only when at least one group in the cluster actually meets
        // there. An "about" cluster never does, and keeps the diamond so the
        // shape still reads as a subject rather than a venue.
        const anyMeets = !c.about && c.members.some(meetsHere);
        const cc = colorOf(c.members[0]);
        if (c.about) {
          hit.append('rect')
            .attr('x', -CLUSTER_R).attr('y', -CLUSTER_R)
            .attr('width', CLUSTER_R * 2).attr('height', CLUSTER_R * 2)
            .attr('transform', 'rotate(45)')
            .style('fill', 'var(--bg)').style('stroke', cc).style('stroke-width', '2.4px');
        } else {
          hit.append('circle').attr('r', CLUSTER_R)
            .style('fill', anyMeets ? cc : 'var(--bg)')
            .style('fill-opacity', anyMeets ? 0.92 : 1)
            .style('stroke', cc)
            .style('stroke-width', anyMeets ? '2px' : '2.4px');
        }
        // .pn-count sets fill:#fff in CSS, which would print white on bone
        // over a hollow marker, so the colour is set inline here.
        hit.append('text').attr('class', 'pn-count')
          .attr('text-anchor', 'middle').attr('dy', '0.34em')
          .style('fill', anyMeets ? '#fff' : cc)
          .text(c.members.length);
      } else {
        shape(hit, c.members[0], MARKER_R, c.about);
      }

      // One click, one answer. A single group opens its own card; a place
      // holding several opens a card listing them. The screen position is read
      // at click time rather than captured here, because the node outlives any
      // particular frame now.
      const open = (ev) => {
        ev.stopPropagation();
        const p = ctx.projection([c.lon, c.lat]);
        const at = (p && Number.isFinite(p[0])) ? { x: p[0], y: p[1] } : null;
        if (many) api.selectCluster(c, at);
        else api.select(c.members[0]);
      };
      hit.on('click', open).on('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(ev); }
      });

      if (opts.onHover) {
        hit.on('mouseenter', (ev) => opts.onHover(many ? null : c.members[0], many ? c : null, ev))
           .on('mousemove', (ev) => opts.onHoverMove?.(ev))
           .on('mouseleave', () => opts.onHover(null, null));
      }
    }

    // Match DOM nodes to the current cluster set. Only runs after a filter
    // change, never during rotation.
    function sync() {
      if (joined) return;
      const sel = gMarks.selectAll('g.pn-cluster').data(scope().clusters, (d) => d.key);
      sel.exit().remove();
      sel.enter().append('g').attr('class', 'pn-cluster')
        .each(function (c) { buildNode(d3.select(this), c); });
      joined = true;
      restyle();
    }

    const isSelected = (c) => (c.members.length > 1)
      ? ((selectedCluster && selectedCluster.key === c.key) ||
         (selectedId != null && c.members.some((m) => m.id === selectedId)))
      : c.members[0].id === selectedId;

    // Selection is a class, not a rebuild, so changing it costs nothing.
    function restyle() {
      gMarks.selectAll('g.pn-cluster').each(function (c) {
        d3.select(this).select('.pn-marker, .pn-clusternode')
          .classed('is-selected', !!isSelected(c));
      });
    }

    // Per frame: move each marker and hide the ones behind the horizon. No DOM
    // is created or destroyed here.
    function draw() {
      checkZoomDetail();
      sync();
      let anchor = null;
      gMarks.selectAll('g.pn-cluster').each(function (c) {
        const node = this;
        if (!facing(c.lon, c.lat)) { node.style.display = 'none'; return; }
        const p = ctx.projection([c.lon, c.lat]);
        if (!p || !Number.isFinite(p[0])) { node.style.display = 'none'; return; }
        node.style.display = '';
        node.setAttribute('transform', `translate(${p[0]},${p[1]})`);
        if (isSelected(c)) anchor = { x: p[0], y: p[1] };
      });
      opts.onAnchor?.(anchor);
    }

    // Selecting changes a class; filtering changes which markers exist. Only
    // the second needs invalidate(), and keeping them apart is what stops a
    // click from rebuilding the whole layer.
    const api = {
      select(g) {
        selectedId = g ? g.id : null;
        selectedCluster = null;
        opts.onSelect?.(g);
        restyle();
        draw();
      },
      // A place holding several groups. The host shows them as a list in the
      // same card, so one click always lands on something readable.
      selectCluster(cluster, at) {
        selectedCluster = cluster;
        selectedId = null;
        opts.onCluster?.(cluster, at);
        restyle();
        draw();
      },
      clear() {
        selectedId = null; selectedCluster = null;
        opts.onSelect?.(null);
        restyle();
        draw();
      },
      groups: () => all,
      scoped: () => scope().scoped,
      networks: NETWORKS,
      setActiveNetworks(set) { opts.activeNetworks = set; invalidate(); paint(); draw(); },
      setCountryFilter(iso3) { opts.countryFilter = iso3 || null; invalidate(); paint(); draw(); },
      setExtraFilter(fn) { opts.extraFilter = fn || null; invalidate(); paint(); draw(); },
    };

    // hand the api back to the host so it can drive the layer from its chrome
    opts.onReady?.(api);

    const off = ctx.onRender(draw);
    paint();
    draw();

    return {
      update() { invalidate(); paint(); draw(); },
      destroy() { off(); ctx.group.selectAll('*').remove(); if (ctx.setPaint) ctx.setPaint(null); },
    };
  },
};
