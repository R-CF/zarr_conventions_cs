# Coordinate Set Convention

- **UUID**: e4dbf0b7-7a00-4ce6-b23e-484292014ab4
- **Name**: "cs"
- **Schema URL**: "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/schema.json"
- **Spec URL**: "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/README.md"
- **Scope**: Array, Group
- **Extension Maturity Classification**: Pilot
- **Owner**: @pvanlaake

## Description

Zarr arrays have a mandatory `shape` attribute with an element for each array dimension and the element value giving the length of the dimension. This establishes an indexing space with which elements in the array can be addressed. Zarr is agnostic with regards to the semantics of dimensions and shape elements. This convention presents a schema to attach coordinate values to the dimensions of the array shape and its elements. In common language this is usually referred to as a coordinate system.

This convention implements the relevant parts of the OGC standard [Referencing by Coordinates](http://www.opengis.net/doc/AS/topic-2/5.0.1), but applied to the Zarr specification and extended to dimensions beyond the spatio-temporal domain. The central concept is the **coordinate reference system** (CRS), which links a **coordinate system** to a **reference frame** (formerly named a "datum", which registers the coordinate system to some location on Earth). The **coordinate system** has axes and properties such as units-of-measure and direction. These concepts are all still "abstract": they define a model to describe the locations of points on Earth, but the coordinates of the points themselves are not there. A **coordinate set** is a materialization of a CRS: where the CRS is a conceptual model, the **coordinate set** is the _specific_ set of axes and their coordinate values that apply to a _specific_ Zarr array. More formally (section 7.1 of the OGC standard):

> A _coordinate_ is one of _n_ scalar values that define the position of a single point.

> A _coordinate tuple_ is an ordered list of coordinates that define the position of a single point. The coordinates within a coordinate tuple are mutually independent. The number of coordinates in a tuple is equal to the dimension of the coordinate space.

> A _coordinate set_ is a collection of coordinate tuples referenced to the same coordinate reference system. For a coordinate set, one CRS identification or definition may be associated with the coordinate set and then all coordinate tuples in that coordinate set inherit that association.

This convention implements a **coordinate set** for Zarr arrays based on the OGC model for referencing by coordinates. It implements a subset of the standard (a CRS is always assumed to have a Cartesian coordinate system, for instance), but it extends it to accommodate non-spatial dimensions that are commonly found in higher-dimensional Zarr arrays. The design of this convention is reversed from the OGC description. Whereas in the OGC standard the CRS is the principal object to which other objects relate, in this convention the principal object is the **coordinate set** which has the coordinate system and one or more CRSs embedded in its structure.

The top-level property in this convention is `cs` and is usually placed at the root `attributes` level of the Zarr array metadata. The `cs` property has an array of `crs` objects that jointly describe the coordinate set. CRSs may be shared between multiple arrays in a single Zarr store. This is achieved by placing an list of `crs` objects in a group and referencing that group and its `crs` attribute from a Zarr array.

This convention uses the [`proj` convention](https://github.com/zarr-conventions/geo-proj) to describe the reference frame linking the coordinate system to Earth. See the Examples section on how these two conventions can be combined.

### Compositing a coordinate set

In the OGC standard, a CRS describes a spatial (2D, 3D), vertical (1D) or temporal (1D) domain. Each CRS has its own coordinate system. In this convention multiple CRSs are composited to create a single coordinate system that has the same rank as the Zarr array whose coordinate set is represented. The `cs` property of a Zarr array describes one or more CRSs in its `crs` array property. Each `crs` object in that array describes one or more axes and each axis has one or more sets of coordinates for the positions along the axis. Jointly, these `crs` objects must have the same rank as the Zarr array and the composition of the coordinates from the axes constitute the coordinate set of the Zarr array.

The `crs` objects may be shared between multiple Zarr arrays by defining the `crs` objects in the metadata of a Zarr group. The Zarr array will then have a reference to the `crs` objects in its `cs` object. The composition of the coordinate set is otherwise exactly the same. As an example, a Zarr group may define a `crs` object for the planar X-Y coordinates and another one for a vertical atmospheric profile. A Zarr array with surface temperature will reference just the X-Y `crs` from the Zarr group, while another Zarr array in the same store using the same X-Y `crs` object can composite both CRSs to describe vertical temperature profiles. A temporal CRS may be added to store time series for either Zarr array. The _specific_ parameters that the Zarr array derives from these CRSs then materialize the coordinate set. Note that this arrangements mimics the composition of CRSs in the OGC standard.

The Zarr arrays must have their `dimension_names` metadata entry set. There must be an axis for each entry in the `dimension_names` attribute of the Zarr array. There may be additional axes but these must have a length of 1 and be defined as usual in a `crs` object. Note that these additional axes do not have to be present in the `shape` or `dimension_names` attributes of the Zarr array, although it is legal to do so. See the CMIP6 daily data example, below, for a demonstration of this.

### Secondary arrays

A Zarr array can make use of secondary Zarr arrays to record irregular coordinates (this convention) or other related data. Such secondary arrays are referenced with a fully-qualified path to the secondary array, relative to the referencing array. Parent groups can be indicated with double dots (`".."`) so a sibling array is referred to as `"../sibling"`.

Implementations should make an effort to distinguish between first-class arrays - those that represent scientific variables of interest to the user - and secondary arrays that are additional to the first-class arrays. The user should preferably be presented with the first-class arrays only, with the secondary arrays made available through other constructs, such as the coordinates in this convention.

### CF Metadata Conventions

The objects that make up this convention are in part implemented using the [CF Metadata Conventions](https://cfconventions.org/cf-conventions/cf-conventions.html) for coordinate types and their associated objects. In practice this means that many common data holdings that apply the CF Metadata Conventions may be stored in Zarr using this convention without loss of information. The following features of the CF Metadata Conventions are supported by this convention:

- [Coordinate types](https://cfconventions.org/cf-conventions/cf-conventions.html#coordinate-types) are supported, with minor differences. Latitude and longitude coordinates use other units (`"degrees_north"` and `"degrees_east"` are not true units and they are not used in this convention) and are identified by axis abbreviation and direction. Parametric vertical coordinates are fully supported but use different attributes. Time coordinates are supported for all calendars except explicitly defined calendars, using different attributes. A discrete axis is an ordinal axis in this convention.
- [Scalar coordinate variables](https://cfconventions.org/cf-conventions/cf-conventions.html#scalar-coordinate-variables) are represented as regular axes of length 1 and may be of any supported type. These do not necessarily have to be present in the `shape` and `dimension_names` metadata of the Zarr array.
- [Bounds for one-dimensional coordinate variables](https://cfconventions.org/cf-conventions/cf-conventions.html#bounds-one-d) are an attribute of the coordinates of each axis.
- [String-valued auxiliary coordinate variables](https://cfconventions.org/cf-conventions/cf-conventions.html#labels) are included in the definition of an axis, which may have multiple sets of coordinates. This is particularly useful for ordinal axes but it may be applied to any type of axis.
- [Two-dimensional coordinate variables](https://cfconventions.org/cf-conventions/cf-conventions.html#_two_dimensional_latitude_longitude_coordinate_variables) are represented using the `geolocation` convention.

This convention uses Zarr-specific and/or industry-standard alternatives for several constructs from the CF Metadata Conventions:

- [Reduction of Dataset Size](https://cfconventions.org/cf-conventions/cf-conventions.html#reduction-of-dataset-size) is largely specific to the netCDF format. In Zarr the compression codecs will be used.
- [Horizontal Coordinate Reference Systems, Grid Mappings, and Projections](https://cfconventions.org/cf-conventions/cf-conventions.html#grid-mappings-and-projections) uses an obsolete and incomplete definition of CRSs. The `proj` convention is used in this convention to record the CRS using the OGC [Well-known text representation of coordinate reference systems](https://docs.ogc.org/is/18-010r11/18-010r11.pdf).

Some other parts of the CF Metadata Conventions can be addressed with other Zarr conventions, such as [Ancillary Data](https://cfconventions.org/cf-conventions/cf-conventions.html#ancillary-data) and [External Variables](https://cfconventions.org/cf-conventions/cf-conventions.html#external-variables) that can be encoded using the [ref](https://github.com/R-CF/zarr_convention_ref) convention also used by this convention.

This convention is not a Zarr implementation of the full CF Metadata Conventions and many features are not supported. This convention preserves the _semantics_ of the CF Metadata Conventions (with minor differences), but it uses a very different _encoding_ for efficient storage of CF-compliant data in Zarr, compared to netCDF. It is the responsibility of the user of this convention to ensure that other relevant parts of a CF-compatible data set are adequately addressed, such as user attributes and any other features present in the data set.

## Motivation

- Consistent and explicit description of the semantics of axes and coordinate values for n-dimensional Zarr arrays.
- Compact representation of axes and coordinate values.
- Versatile, expressive and flexible constructs for coordinate reference systems, axes and coordinates.
- Standards-based, easy integration with or translation by existing tools.
- Extensible design to allow for multiple representations of axes and coordinate values.

## Inheritance Model
The `cs` convention applies to an array. The contained `crs` objects may also be defined in a group so that they may be referenced by multiple arrays located elsewhere in the Zarr store. When using this form of inheritance, the array has a reference to the group where the `crs` object is defined and a JSON pointer to the location in the attributes of the group with the definition of the `crs` object. 

## Convention Registration
The convention must be registered in the `zarr_conventions` attribute of the group or array:

```json
{
  "zarr_conventions": [
    {
      "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/schema.json",
      "spec_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/README.md",
      "uuid": "e4dbf0b7-7a00-4ce6-b23e-484292014ab4",
      "name": "cs",
      "description": "Coordinate set for n-dimensional arrays"
    }
  ]
}
```

## Application
This convention can be used with these parts of the Zarr hierarchy:

- [x] Group
- [x] Array

## Group properties
A Zarr group can declare any number of `crs` objects. These will be referenced by key by Zarr arrays elsewhere in the store. The `crs` property is placed at the root of the group `attributes`.

| Field Name | Type   | Description         | Required |
| ---------- | ------ | ------------------- | -------- |
| crs        | object | Keyed `crs` objects | No       |

This field holds any number of [CRS objects](#crs-object) as key-value pairs. The key is not necessarily identical to the name of the `crs`. See the "Group" definition of the "CRU monthly data" example, below, for its formulation.

This field MUST have at least one `crs` object if it is given.

## Array properties
The `cs` property is placed at the root `attributes` level of an array. It is an object with the following fields:

| Field Name | Type                        | Description           | Required |
| ---------- | --------------------------- | --------------------- | -------- |
| name       | string                      | Name of the CS        | No       |
| crs        | [[CRS object](#crs-object)] | Array of `crs` objects | Yes     |
| id         | `proj` object               | Unique identifier of the CS | No |
| attributes | object                      | Attributes of the CS        | No |

Irrespective of the order in which `crs` objects are defined, the composite set of axes resulting from combining the objects in the `crs` array MUST be interpreted in the order in which the axis names appear in the `dimension_names` attribute of the array to which the composited CRS is applied for addressing elements in the Zarr array. Axes of length 1 that are not reflected in the array `dimension_names` attribute may be managed in an application-specific manner.

#### name
The `name` field is a descriptive name of the coordinate set. The name MUST follow standard Zarr requirements for object names.

#### crs
An array of `crs` objects or references to a `crs` object in a group elsewhere in the Zarr store. 

#### id
The unique identifier of the composite CRS, encoded using the `proj` convention. This field SHOULD be included if the coordinate set is composited from multiple `crs` objects for the spatio-temporal domain. If this field is provided it overrides any CRS identifiers from CRSs in the `crs` array.

#### attributes
A JSON document with attributes for the coordinate system.

### CRS object
The `crs` object defines the coordinate system of a single CRS. A Zarr array may have multiple CRSs to fully encompass its coordinate system.

| Field Name  | Type                 | Description                 | Required |
| ----------- | -------------------- | --------------------------- | -------- |
| name        | string               | Name of the CRS             | No       |
| axes        | object               | Keyed list of [Axis object](#axis-object)s | Yes |
| id          | `proj:` object       | Unique identifier of the CS | No       |
| geolocation | `geolocation` object | Geolocation arrays          | No       |

#### name
The `name` field is a descriptive name of the coordinate reference system. If given, the name MUST follow standard Zarr requirements for object names.

#### axes
A set of key-value pairs of `axis` objects. The key is the name of the axis and must match an entry in the `"dimension_names"` metadata of the array for all axes having a length of more than 1. Axes of length 1 may also be present in the `"dimension_names"` metadata but this is not mandatory.

#### id
The unique identifier of the CRS, encoded using the `proj` convention. This field SHOULD be included if the `cs` object does not include an `id` field and the identifier for this CRS is known. If the `id` field of the `cs` object is included, this identifier SHOULD be omitted.

If the `geolocation` field is included, this `id` is typically not known and should thus be excluded. If the `id` is known and specified, it takes precedence over any `crs` field in the `geolocation` object.

#### geolocation
An object using the [`geolocation` convention](https://github.com/R-CF/zarr_convention_geolocation) to provide coordinates for each element of the Zarr array that uses this object. The shape of the geolocation arrays referenced by this object must be the same as the dimensions in the shape of the array that this CRS is for.

### Axis object
The axis object defines all the properties of an individual axis.

| Field Name   | Type     | Description                    | Required    |
| ------------ | ---------| ------------------------------ | ----------- |
| abbreviation | string   | Abbreviation of the axis name  | Conditional |
| coordinates  | [[Coordinates object](#coordinates-object)] | Array of coordinates for the axis | Conditional |
| attributes   | object   | Any other attributes of the axis | No |

#### abbreviation
The abbreviation of the axis. It MUST be provided for axes that are in the spatio-temporal domain, using one of the values `"X"`, `"Y"`, `"Z"` or `"T"`, as appropriate. There may be only one occurrence of any of the abbreviations in the CRS, including across composited CRSs. It MUST be omitted otherwise.

#### coordinates
An array of `coordinates` objects.

#### attributes
Any additional attributes of the axis. This convention does not require or place restrictions on any of these attributes. The interpretation of the attributes is left to the application.

### Coordinates object
An axis may have multiple sets of coordinates. A typical scenario would be an axis representing categorical data where there are multiple sets of categories.

If this field is omitted, the axis is of ordinal type, i.e. a sequence `0..n-1` with `n` being the length of the dimension of the shape that this axis refers to. This field MUST be specified for all other types of axes.

| Field Name | Type     | Description                    | Required    |
| ---------- | ---------| ------------------------------ | ----------- |
| name       | string   | Name of the set of coordinates | No         |
| direction  | string   | Direction of the coordinates   | Conditional |
| unit       | [Unit object](#unit-object) | Unit-of-measure of the coordinates | Conditional |
| time       | [Time object](#time-object) | Time definition for temporal coordinates | Conditional |
| values     | [Values object](#values-object) | The values of the coordinates | Yes        |
| boundaries | [Boundaries object](#boundaries-object) | Boundary values of the coordinates | Conditional |
| parametric | [Parametric object](#parametric-object) | Definition and terms of a parametric coordinate set | No |
| attributes | object   | Any other attributes of the coordinates | No |

#### name
A short name that describes this set of coordinates. The name MAY NOT be used by any other set of coordinates for this axis.

#### direction
The direction of increasing coordinate values. The direction MUST be given for numeric coordinate values; it MAY be given for a string-valued or ordinal values if the associated axis has a natural direction, it SHOULD be omitted otherwise. The value of the `"direction"` field MUST be taken from [Table 48](https://docs.ogc.org/as/18-005r5/18-005r5.html#table_48) of the OGC Standard "Referencing by Coordinates".

For interoperability and ease of interpretation, the following arrangement, as appropriate, is strongly recommended:

| axis abbreviation | typical axis name | direction |
| - | - | - |
| "X" | "longitude", "easting" | "east" |
| "Y" | "latitude", "northing" | "north" |
| "Z" | "pressure", "depth", "elevation" | "up", "down" * |
| "T" | "time" | "future", "past" * |
| others | Any name | Any appropriate value or omitted |

_\* Depending on which way increasing coordinate values go. For instance, pressure and depth are positive down, elevation is positive up._

In image data with a typical coordinate system made up of the (X, Y) coordinate values of the upper-left corner and a grid cell size, the direction for the Y values will still be "north" but the `"increment"` value in the `"values"` field will be negative.

#### values
The values of the coordinates are specified using a `values` object. The values must form a 1-dimensional array.

### Unit object
The unit-of-measure of coordinate values can be expressed as a simple string or using the [`uom` convention](https://github.com/clbarnes/zarr-convention-uom). It MUST be specified for numeric coordinate values, it MAY NOT be specified for temporal or string-valued coordinates or ordinal axes.

When the unit is conventional and commonly understood a simple string value suffices, such as `"m"` or `"kg m-2 s-1"`. If the unit is uncommon or more complex, use of the `uom` convention is recommended.

### Time object
Temporal coordinates are specified using a time unit, an epoch and a calendar. It MUST be specified for an axis representing the temporal domain, it MAY NOT be specified otherwise.

| Field Name | Type   | Description                         | Required |
| ---------- | -------| ----------------------------------- | -------- |
| unit       | string | Time unit                           | Yes      |
| epoch      | string | The epoch for the time calculations | Yes      |
| calendar   | string | Name of a calendar                  | No       |

#### unit
The time unit: "second", "minute", "hour", "day", or "year", or a one-letter abbreviation thereof. The "second" unit may use a sub-multiple prefix, such as "ns" for nano-second. Following the CF Metadata Conventions, it is recommended not to use the unit "month", although it is allowed. The unit "year", possibly with a multiple prefix such as "ky" for "kilo-year", should only be used for coordinates that span very long time scales, such as over paleological periods.

#### epoch
An instant in time against which time coordinates are calculated. This should be a string value in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format, with an allowance for instants that do not exist in the Gregorian calendar (such as "2026-02-30" in a "360_day" calendar). At the epoch instant, the stored value is 0.

#### calendar
A calendar to use for the calculations. This can be a common calendar or a model calendar as used in climate projection data sets. This field is recommended but it may be omitted, in which case the calendar will be application-defined, typically `"standard"` or `"proleptic_gregorian"`.

### Values object
The values the coordinates can be represented in different ways. One, and only one, of the below fields MUST be specified.

| Field Name | Type     | Description                                           | Required    |
| ---------- | ---------| ----------------------------------------------------- | ----------- |
| regular    | [number] | Initial coordinate value and increment                | Conditional |
| external   | `ref` object | Reference to an external array with coordinate values | Conditional |
| explicit   | []       | JSON array of coordinate values                       | Conditional |

#### regular
This method is preferred when the numeric coordinate values are equally spaced and thus monotonically increasing or decreasing. The JSON array consists of the coordinate of the first element along the dimension (at shape index `0`) of the axis, followed by the increment to make subsequent coordinate values, possibly negative. The increment may not be 0.

#### external
When coordinate values are irregular or for long string-valued axes, the coordinate values should be supplied in a 1-dimensional array elsewhere in the Zarr store. This parameter gives the reference to the array with the coordinate values. That array MUST have one dimension in its `shape`, whose value is identical to the dimension in the `shape` of this array that the axis refers to.

#### explicit
For short axes and single-valued axes this parameter supplies the coordinate values. For axes having a greater length use of the `"external"` object is recommended.

### Boundaries object

By default, numeric coordinate values represent a point in the coordinate space. If the coordinate is representative for a finite extent in the coordinate space of the axis, the boundary values of the coordinates specify the extent. The boundary values can be represented in different ways. One, and only one, of the below fields MUST be specified if the coordinate values represent a finite extent; this clause MUST be omitted if the coordinates represent a point.

Boundary values are only applicable to coordinates expressed in numeric values. They SHOULD NOT be specified for string-type or ordinal axes.

| Field Name | Type     | Description                                                     | Required    |
| ---------- | ---------| --------------------------------------------------------------- | ----------- |
| regular    | [number] | JSON array with the extent below and above the coordinate value | Conditional |
| external   | `ref` object | Reference to an array providing boundary values             | Conditional |
| attributes | object   | Any other attributes of the boundaries object                   | No          |

#### regular
When the extent around coordinate values is constant over the coordinate space of the axis, for lower and higher values separately, the boundary values are regular and expressed as a JSON array with the lower and higher extent, respectively, in units of the coordinate values.

#### external
When the extent around coordinate values is irregular, the boundary values should be given in a Zarr array external to this array or group. This field contains a reference with the path to a 2-dimensional array with boundary values, with the first dimension having a length of 2 for the lower and upper boundary values, respectively, and the second dimension having a length equal to the dimension of the shape that the axis refers to.

### Parametric object

Coordinates belonging to an axis may be defined in parametric terms. This usually applies to a vertically-oriented axis. Typical applications of vertical parametric coordinates are in coastal waters with a time-dependent tidal effect, and near-surface atmospheric dynamics in the presence of pronounced topography. The parametric coordinates are typically 4-dimensional (latitude-longitude-height-time) and thus very voluminous; the terms used in the derivation of the parametric coordinates are of lower rank and thus much more economical in storage and transmittal.

For the two application areas of oceanograhpy and atmospheric dynamics, several standard formulas have been defined; an overview of the structure is given in the CF Metadata Conventions sections on [parametric vertical coordinates](https://cfconventions.org/cf-conventions/cf-conventions.html#parametric-vertical-coordinate), with details on the formulas and their _terms_ provided in [Appendix D](https://cfconventions.org/cf-conventions/cf-conventions.html#parametric-v-coord). This convention does not follow the attribute arrangement of the CF Metadata Conventions for parametric vertical coordinates.

In this convention, the _parametric term_ is the principal object whose coordinates are given in the `"values"` field (similar to the CF arrangement). The formula _terms_ are given in this object.

The calculation of the parametric coordinate values is done at the application level, applying the formulas given in Appendix D of the CF Metadata Conventions.

| Field Name | Type   | Description                           | Required |
| ---------- | ------ | ------------------------------------- | -------- |
| formula    | string | The name of the formulation, the `"standard_name"` used in CF | Yes |
| terms      | object | Keyed [Values object](#values-object) | Yes      |

#### formula
The `formula` field records the name of the formula. It SHOULD be identical to one of the "standard_names" defined in the CF Metadata Conventions for vertical parametric coordinates; otherwise it MUST be a URI to a human-readable description of the formulation.

#### terms
The `terms` field is a keyed JSON object, where the key corresponds to one of the formula _terms_ as defined in the CF Metadata Conventions (the key-value association is equivalent in information content to the CF "formula_terms" attribute), and the value is a `values` object.

This field MUST have as many `values` objects as the `formula` field implies.

## Examples
The below examples focus on the specification of the `cs` attribute for various types of files - other parts of the Zarr array specification, including general attributes, are omitted for brevity. More examples can be found in the "examples" directory.

### Typical CMIP6 data set at daily resolution
Data set: tasmin_day_GFDL-ESM4_historical_r1i1p1f1_gr1_19260605-19491231

A typical CMIP6 data set contains a single data variable. The coordinate set can then be specified in the attributes of the Zarr array. The spatial and temporal dimensions are regular and specified in-line. A single-valued axis `"height"` ("scalar axis" in the CF Metadata Conventions) is not present in the Zarr array but can still be specified.

```
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [8605, 180, 288],
  "dimension_names": ["time", "lat", "lon"],
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/schema.json",
        "name": "cs"
      }
    ],
    "cs": {
      "crs": [
        {
          "name": "WGS84",
          "axes": [
            {
              "name": "lon",
              "abbreviation": "X",
              "direction": "east",
              "coordinates": [
                {
                  "unit": "degrees",
                  "values": { "regular": [0.625, 1.25] },
                  "boundaries": { "regular": [-0.625, 0.625] }
                }
              ]
            },
            {
              "name": "lat",
              "abbreviation": "Y",
              "direction": "north",
              "coordinates": [
                {
                  "unit": "degrees",
                  "values": { "regular": [-89.5, 1] },
                  "boundaries": { "regular": [-0.5, 0.5] }
                }
              ]
            }
          ],
          "id": { "proj:code": "EPSG:4326" }
        },
        {
          "name": "Temporal scale based on the 'noleap' model calendar.",
          "axes": [
            {
              "name": "time",
              "abbreviation": "T",
              "direction": "future",
              "coordinates": [
                {
                  "time": {
                    "unit": "days",
                    "epoch": "1850-01-01",
                    "calendar": "noleap"
                  },
                  "values": { "regular": [27895.5, 1] },
                  "boundaries": { "regular": [-0.5, 0.5] }
                }
              ]
            }
          ]
        },
        {
          "name": "Height above surface for standard meteorological measurements.",
          "axes": [
            {
              "name": "height",
              "abbreviation": "Z",
              "direction": "up",
              "coordinates": [
                {
                  "unit": "meter",
                  "values": { "explicit": [2] }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### Typical CMIP6 data set at monthly resolution
Data set: ts_Amon_GFDL-ESM4_historical_r1i1p1f1_gr1_18500116-19491216

As the previous example, less the single-valued axis, but now the temporal dimension and its boundary values are irregular and stored as external Zarr arrays in the same store.

```
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [1200, 180, 288],
  "dimension_names": ["time", "lat", "lon"],
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
        "name": "ref"
      }
    ],
    "cs": {
      "crs": [
        {
          "name": "WGS84",
          "axes": [
            {
              "name": "lon",
              "abbreviation": "X",
              "direction": "east",
              "coordinates": [
                {
                  "unit": "degrees",
                  "values": { "regular": [0.625, 1.25] },
                  "boundaries": { "regular": [-0.625, 0.625] }
                }
              ]
            },
            {
              "name": "lat",
              "abbreviation": "Y",
              "direction": "north",
              "coordinates": [
                {
                  "unit": "degrees",
                  "values": { "regular": [-89.5, 1] },
                  "boundaries": { "regular": [-0.5, 0.5] }
                }
              ]
            }
          ]
        },
        {
          "name": "Temporal scale based on the 'noleap' model calendar.",
          "axes": [
            {
              "name": "time",
              "abbreviation": "T",
              "direction": "future",
              "coordinates": [
                {
                  "time": {
                    "unit": "days",
                    "epoch": "1850-01-01",
                    "calendar": "noleap"
                  },
                  "values": {
                    "ref": {
                      "external": { "node": "../time" }
                    }
                  },
                  "boundaries": {
                    "ref": {
                      "external": { "node": "../time_bnds" }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### CRU Monthly data
Data set: cru_ts4.07.1901.2022.tmp.dat

The CRU data files usually have a single data variable but an additional variable to indicate the number of stations contributing data to the local interpolated value. The additional variable has the same coordinate set as the principal variable and the `cs` object is thus shared between the two variables.

#### Group: Defining the coordinate set
The axes for the coordinate set are described in this group. The "standard_calendar" temporal axis is external, but located as Zarr array "time" in this group.

```
{
  "zarr_format": 3,
  "node_type": "group",
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
        "name": "ref"
      }
    ],
    "crs": {
      "WGS84": {
        "axes": [
          {
            "name": "lon",
            "abbreviation": "X",
            "direction": "east",
            "coordinates": [
              {
                "unit": "degrees",
                "values": { "regular": [-179.75, 0.5] }
              }
            ]
          },
          {
            "name": "lat",
            "abbreviation": "Y",
            "direction": "north",
            "coordinates": [
              {
                "unit": "degrees",
                "values": { "regular": [-89.75, 0.5] }
              }
            ]
          }
        ],
        "id": { "proj:code": "EPSG:4326" }
      },
      "standard_calendar": {
        "axes": [
          {
            "name": "time",
            "abbreviation": "T",
            "direction": "future",
            "coordinates": [
              {
                "time": {
                  "unit": "days",
                  "epoch": "1900-01-01",
                  "calendar": "standard"
                },
                "values": {
                  "ref": {
                    "external": { "node": "../time" }
                  }
                }
              }
            ]
          }
        ]
      }
    }
  }
}
```

#### Array: Referencing the coordinate set
The Zarr array holding the CRU data is located immediately below the Zarr group defining the coordinate set.

```
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [1464, 360, 720],
  "dimension_names": ["time", "lat", "lon"],
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
        "name": "ref"
      }
    ],
    "cs": {
      "crs": [
        {
          "ref": {
            "node": "..",
            "attribute": "/attributes/crs/WGS84"
          }
        },
        {
          "ref": {
            "node": "..",
            "attribute": "/attributes/crs/standard_calendar"
          }
        }
      ]
    }
  }
}
```

### CORDEX data with geolocation arrays
Data set: pr_EUR-11_MOHC-HadGEM2-ES_rcp45_r1i1p1_CLMcom-CCLM4-8-17_v1_day_20060101-20101230

CORDEX regionally downscaled climate projection data typically uses a so-called _rotated latitude-longitude grid_. This is a grid in typical latitude and longitude coordinates but it is not oriented towards true North. There are no standard CRSs defined for them. In the netCDF format, the data files invariably have _auxiliary coordinate variables_ with the geolocation arrays. Using this convention these geolocation arrays can be described.

```
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [1800, 412, 424],
  "dimension_names": ["time", "rlat", "rlon"],
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/main/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_geolocation/main/schema.json",
        "name": "geolocation"
      }
    ],
    "cs": {
      "crs": [
        {
          "name": "rotated pole grid for the CORDEX EUR-11 domain",
          "axes": [
            {
              "name": "rlon",
              "abbreviation": "X",
              "direction": "east",
              "coordinates": [
                {
                  "unit": "degrees",
                  "values": {
                    "regular": [-28.375, 0.11]
                  }
                }
              ]
            },
            {
              "name": "rlat",
              "abbreviation": "Y",
              "direction": "north",
              "coordinates": [
                {
                  "unit": "degrees",
                  "values": {
                    "regular": [-23.375, 0.11]
                  }
                }
              ]
            }
          ],
          "geolocation": {
            "geodetic": {
              "x": {
                "ref": {
                  "node": "../lon"
                }
              },
              "y": {
                "ref": {
                  "node": "../lat"
                }
              },
              "crs": {
                "proj:code": "EPSG:4326"
              }
            }
          }
        },
        {
          "name": "Temporal scale based on the '360_day' model calendar.",
          "axes": [
            {
              "name": "time",
              "abbreviation": "T",
              "direction": "future",
              "coordinates": [
                {
                  "time": {
                    "unit": "days",
                    "epoch": "1949-12-01",
                    "calendar": "360_day"
                  },
                  "values": {
                    "regular": [20190.5, 1]
                  },
                  "boundaries": {
                    "regular": [-0.5, 0.5]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

## Known Implementations

### Libraries and Tools

- **[geozarr](https://github.com/R-CF/geozarr)** - R package for GeoZarr arrays
  - Language: R
  - Status: Released
  - Maintainer: @pvanlaake
  - Since: 2026-07-25
- **[xarray-zarr-xgroup](https://github.com/pvanlaake/xarray-zarr-xgroup)** - XArray backend for GeoZarr support with cross-group referencing
  - Language: Python
  - Status: Released
  - Maintainer: @pvanlaake
  - Since: 2026-06-15

_If you implement or use this convention, please add your implementation to this list by opening an issue or submitting a pull request._
