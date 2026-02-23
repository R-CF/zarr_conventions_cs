# Coordinate System Convention

- **UUID**: e4dbf0b7-7a00-4ce6-b23e-484292014ab4
- **Name**: "cs"
- **Schema URL**: "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/schema.json"
- **Spec URL**: "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/README.md"
- **Scope**: Array, Group
- **Extension Maturity Classification**: Proposal
- **Owner**: @pvanlaake

## Description

This convention defines a coordinate system for Zarr arrays, with axes for each of the dimensions in the array shape and having a coordinate value for each element along the dimension. The top-level property is `cs` and is placed at the root `attributes` level following the [Zarr Conventions Specification](https://github.com/zarr-conventions/zarr-conventions-spec). The `cs` property has a hierarchy of sub-objects that jointly describe the coordinate system of the array.

Zarr arrays have a mandatory `shape` attribute with an element for each dimension in the array and the element value giving the length of the dimension. This establishes an indexing space with which elements in the array can be addressed. Zarr is agnostic with regards to the semantics of dimensions and shape elements. This convention presents a schema to attach "meaning" to the dimensions of the array shape and its elements. It is applicable to all dimensions of an n-dimensional array.

In addition to defining axes and coordinate values, this convention defines auxiliary axis properties such as boundary values. This convention also allows for the construction of single-valued axes not represented in the array.

This convention follows the guidance from OGC standard [Referencing by Coordinates](http://www.opengis.net/doc/AS/topic-2/5.0.1) related to coordinate system and axis definitions, but applied to the Zarr specification and extended to dimensions beyond the spatio-temporal domain. Constructs are based on the [CF Metadata Conventions](https://cfconventions.org/cf-conventions/cf-conventions.html) for coordinate types and coordinate systems and their associated objects.

Coordinate systems may be shared by multiple arrays in a single Zarr store. This is achieved by placing the `cs` properties in a group and referencing that group and the `cs` attribute from each array.

Coordinate systems may also be composed from multiple other coordinate systems that each cover a sub-domain of the main coordinate system. As an example, a coordinate system may be defined for the planar X-Y coordinates and another one for a vertical atmospheric profile. An array with surface temperature will reference just the X-Y coordinate system, while another array in the same store using the same X-Y coordinates can composite both coordinate systems to describe vertical temperature profiles. A temporal coordinate system may be added to store time series for either array. Note that this arrangements mimics the composition of CRS's in the OGC standard.

This convention does not include other CRS constructs as these are provided by the [`proj:` convention](https://github.com/zarr-conventions/geo-proj). See the Examples section on how these two conventions can be combined.

## Motivation

- Consistent and explicit description of the semantics of axes and coordinate values for n-dimensional Zarr arrays.
- Compact representation of axes and coordinate values compared to using coordinate variables.
- Versatile, expressive and flexible constructs for coordinate systems, axes and coordinates.
- Standards-based, easy integration with or translation by existing tools.
- Extensible design to allow for multiple representations of axes and coordinate values.

## Inheritance Model
The `cs` convention may be applied to a single array or it may be defined in a group so that it can be referenced by multiple arrays located elsewhere in the Zarr store. When using inheritance, the array has a reference to the `cs` attribute with a path to the group where it is defined.

## Convention Registration
The convention must be registered in `zarr_conventions`:

```json
{
  "zarr_conventions": [
    {
      "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/schema.json",
      "spec_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/README.md",
      "uuid": "e4dbf0b7-7a00-4ce6-b23e-484292014ab4",
      "name": "cs",
      "description": "Coordinate system for arrays"
    }
  ]
}
```

## Application
This convention can be used with these parts of the Zarr hierarchy:

- [x] Group
- [x] Array

## Properties
The `cs` property is placed at the root `attributes` level of a group or array. In an array it is always a single object, in a group it may be a single `cs` object or an array thereof. It has the following fields:

| Field Name | Type                        | Description                    | Required    |
| ---------- | --------------------------- | ------------------------------ | ----------- |
| name       | string                      | Name of the coordinate system. | Conditional |
| composite  | [ref] | Array of references to coordinate systems that this coordinate system is composed of. | Conditional |
| axes       | [Axis object](#axis-object) | Array of axis properties.      | Conditional |

At least one of `composite` and `axes` MUST be provided.

Irrespective of the order in which coordinate systems and axes are defined, the composite set of axes resulting from combining the `composite` and `axes` fields MUST be interpreted in the order in which the axis names appear in the `dimension_names` attribute of the array to which the composited coordinate system is applied for addressing elements in the array.

#### name
The `name` attribute is a descriptive name of the coordinate system by which it may be referenced by other objects in the Zarr store. The name MUST follow standard Zarr requirements for object names.

This attribute is REQUIRED when the coordinate system object is located in a group. 

In an array, the name can be an optional description of the coordinate system locally applicable to the array.

#### composite
An array of `ref` objects, each referencing a coordinate system object in a group using a path to the group and the name of the `cs` attribute in the group. 

### Axis object
The axis object defines all the properties of an individual axis.

| Field Name   | Type     | Description                    | Required    |
| ------------ | ---------| ------------------------------ | ----------- |
| name         | string   | Name of the axis.              | Yes         |
| abbreviation | string   | Abbreviation of the axis name. | Conditional |
| direction    | string   | Direction of the axis.         | Conditional |
| unit         | uom      | Unit-of-measure of the axis coordinates. | Conditional |
| time         | [Time object](#time-object) | Time definition for a temporal axis. | Conditional |
| values       | [Values object](#values-object) | The values of the coordinates. | Yes        |
| boundaries   | [Boundaries object](#boundaries-object) | Boundary values of the coordinates. | Conditional |
| attributes   | {} | Any other attributes of the axis. | No |

#### name
A short name that describes this axis. The name MUST be present in the `dimension_names` attribute of the array, unless the axis is single-valued. The name MAY NOT be used by any other axis in the coordinate system, including over composited coordinate systems.

#### abbreviation
The abbreviation of the axis. It MUST be provided for axes that are in the spatio-temporal domain, using the string values `"X"`, `"Y"`, `"Z"` and `"T"`, as appropriate. It MUST be omitted otherwise.

#### direction
The direction of increasing coordinate values. The direction MUST be given for an axis using numeric coordinate values; it MAY be given for a string-valued or ordinal axis if the axis has a natural direction, it SHOULD be omitted otherwise. The value of the `"direction"` field MUST be taken from [Table 48](https://docs.ogc.org/as/18-005r5/18-005r5.html#table_48) of the OGC Standard "Referencing by Coordinates".

For interoperability and ease of interpretation, the following arrangement, as appropriate, is strongly recommended:

| abbreviation | typical name | direction |
| - | - | - |
| "X" | "longitude", "easting" | "east" |
| "Y" | "latitude", "northing" | "north" |
| "Z" | "pressure", "depth", "elevation" | "up", "down" * |
| "T" | "time" | "future" |
| others | Any name | Any appropriate value or omitted |
_\* Depending on which way increasing coordinate values go. For instance, pressure and depth are positive down, elevation is positive up._

In image data with a typical coordinate system made up of the (X, Y) coordinate values of the upper-left corner and a pixel size, the direction for the Y axis will still be "north" but the `"increment"` value in the `"values"` parameter of the Y axis will be negative.

#### unit
The unit-of-measure of coordinate values is expressed using the [`uom` convention](https://github.com/clbarnes/zarr-convention-uom). It MUST be specified for axes with numeric coordinate values, it MAY NOT be specified for temporal, string-valued or ordinal axes.

#### attributes
Any additional attributes of the axis. This convention does not require or place restrictions on any of these attributes. The interpretation of the attributes is left to the application.

### Time object
The temporal dimension is specified using a reference date-time and a calendar, using the specification of the [CF Metadata Conventions](https://cfconventions.org/cf-conventions/cf-conventions.html#time-coordinate). It MUST be specified for an axis representing the temporal domain, it MAY NOT be specified otherwise.

| Field Name | Type   | Description                                           | Required  |
| ---------- | -------| ----------------------------------------------------- | --------- |
| reference  | string | Reference date-time and unit from which time coordinates are calculated. | Yes |
| calendar   | string | Name of a calendar. | No |

#### reference
The reference date-time from which time coordinates are calculated. This takes the form of `"days since 1949-12-01"`.

#### calendar
A calendar to use for the calculations. This can be a common calendar or a model calendar as used in climate projection data sets. This field is recommended but it may be omitted, in which case the calendar will be application-defined, typically `"standard"` or `"proleptic_gregorian"`.

### Values object
The values of an axis are usually (but not necessarily) its coordinates. They can be represented in different ways. One, and only one, of the below fields MUST be specified.

| Field Name | Type     | Description                                           | Required    |
| ---------- | ---------| ----------------------------------------------------- | ----------- |
| regular    | [number] | Initial coordinate value and increment.               | Conditional |
| external   | string   | Path to a 1-dimensional array with coordinate values. | Conditional |
| explicit   | []       | JSON array of coordinate values.                      | Conditional |

#### regular
This method is preferred when the numeric coordinate values of the axis are equally spaced and thus monotonically increasing or decreasing. The JSON array consists of the coordinate of the first element along the dimension (at shape index `0`), followed by the increment to make subsequent coordinate values, possibly negative. The increment may not be 0.

#### external
When coordinate values are irregular or for long string-valued axes, the coordinate values should be supplied in a 1-dimensional array elsewhere in the Zarr store. This parameter gives the path to the array with the coordinate values. That array MUST have one dimension in its `shape`, whose value is identical to the dimension in the `shape` of this array that the axis refers to.

#### explicit
For short (string-valued) axes (max. 20 ~ 25 elements) and single-valued axes this parameter supplies the coordinate values. For axes having a greater length use of the `"external"` object is recommended.

### Boundaries object

By default, numeric coordinate values represent a point in the coordinate space. If the coordinate is representative for a finite extent in the coordinate space of the axis, the boundary values of the axis specify the extent. The boundary values can be represented in different ways. One, and only one, of the below fields MUST be specified if the coordinate value represents a finite extent; this clause MUST be omitted if the coordinates represent a point.

Boundary values are only applicable to axes whose coordinates are expressed in numeric values. They SHOULD NOT be specified for string-type or ordinal axes.

| Field Name | Type     | Description                                                      | Required    |
| ---------- | ---------| ---------------------------------------------------------------- | ----------- |
| regular    | [number] | JSON array with the extent below and above the coordinate value. | Conditional |
| external   | ref      | Reference to an array providing boundary values.                 | Conditional |

#### regular
When the extent around coordinate values is constant over the coordinate space of the axis, for lower and higher values separately, the boundary values are regular and expressed as a JSON array with the lower and higher extent, respectively, in units of the coordinate values.

#### external
When the extent around coordinate values is irregular, the boundary values should be given in a Zarr array external to this array or group. This field contains a reference with the path to a 2-dimensional array with boundary values, with the first dimension having a length of 2 for the lower and upper boundary values, respectively, and the second dimension having a length equal to the dimension of the shape that the axis refers to.

## Examples
The below examples focus on the specification of the `cs` attribute for various types of files - other parts of the Zarr array specification, including general attributes, are omitted for brevity.

### Typical CMIP6 data set at daily resolution
Data set: tasmin_day_GFDL-ESM4_historical_r1i1p1f1_gr1_19260605-19491231

A typical CMIP6 data set contains a single data variable. The coordinate system can then be specified in the attributes of the Zarr array. The spatial and temporal dimensions are regular and specified in-line. A single-valued axis `"height"` ("scalar axis" in the CF Metadata Conventions) is not present in the Zarr array but can still be specified.

```
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [8605, 180, 288],
  "dimension_names": ["time", "lat", "lon"],
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/clbarnes/zarr-convention-uom/refs/tags/v1/schema.json",
        "name": "uom"
      }
    ],
    "cs": {
      "axes": [
        {
          "name": "lon",
          "abbreviation": "X",
          "direction": "east",
          "unit": {
            "uom": {
              "ucum": {
                "unit": "degrees"
              }
            }
          },
          "values": {
            "regular": [0.625, 1.25]
          },
          "boundaries": {
            "regular": [-0.625, 0.625]
          }
        },
        {
          "name": "lat",
          "abbreviation": "Y",
          "direction": "north",
          "unit": {
            "uom": {
              "ucum": {
                "unit": "degrees"
              }
            }
          },
          "values": {
            "regular": [-89.5, 1]
          },
          "boundaries": {
            "regular": [-0.5, 0.5]
          }
        },
        {
          "name": "time",
          "abbreviation": "T",
          "direction": "future",
          "time": {
            "reference": "days since 1850-01-01",
            "calendar": "noleap"
          },
          "values": {
            "regular": [27895.5, 1]
          },
          "boundaries": {
            "regular": [-0.5, 0.5]
          }
        },
        {
          "name": "height",
          "abbreviation": "Z",
          "direction": "up",
          "unit": {
            "uom": {
              "unit": "metre"
            }
          },
          "values": {
            "explicit": [2]
          }
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
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/clbarnes/zarr-convention-uom/refs/tags/v1/schema.json",
        "name": "uom"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
        "name": "ref"
      }
    ],
    "cs": {
      "axes": [
        {
          "name": "lon",
          "abbreviation": "X",
          "direction": "east",
          "unit": {
            "uom": {
              "ucum": {
                "unit": "degrees"
              }
            }
          },
          "values": {
            "regular": [0.625, 1.25]
          },
          "boundaries": {
            "regular": [-0.625, 0.625]
          }
        },
        {
          "name": "lat",
          "abbreviation": "Y",
          "direction": "north",
          "unit": {
            "uom": {
              "ucum": {
                "unit": "degrees"
              }
            }
          },
          "values": {
            "regular": [-89.5, 1]
          },
          "boundaries": {
            "regular": [-0.5, 0.5]
          }
        },
        {
          "name": "time",
          "abbreviation": "T",
          "direction": "future",
          "time": {
            "reference": "days since 1850-01-01",
            "calendar": "noleap"
          },
          "values": {
            "external": {
              "ref": {
                "array": "time"
              }
            }
          },
          "boundaries": {
            "external": {
              "ref": {
                "array": "time_bnds"
              }
            }
          }
        }
      ]
    }
  }
}
```

### CRU Monthly data
Data set: cru_ts4.07.1901.2022.tmp.dat

The CRU data files usually have a single data variable but an additional variable to indicate the number of stations contributing data to the local interpolated value. The additional variable has the same coordinate system as the principal variable and the `cs` object is thus shared between the two variables.

#### Group: Defining the coordinate system
```
{
  "zarr_format": 3,
  "node_type": "group",
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/clbarnes/zarr-convention-uom/refs/tags/v1/schema.json",
        "name": "uom"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
        "name": "ref"
      }
    ],
    "cs": {
      "name": "CRU_cs",
      "axes": [
        {
          "name": "lon",
          "abbreviation": "X",
          "direction": "east",
          "unit": {
            "uom": {
              "ucum": {
                "unit": "degrees"
              }
            }
          },
          "values": {
            "regular": [-179.75, 0.5]
          }
        },
        {
          "name": "lat",
          "abbreviation": "Y",
          "direction": "north",
          "unit": {
            "uom": {
              "ucum": {
                "unit": "degrees"
              }
            }
          },
          "values": {
            "regular": [-89.75, 0.5]
          }
        },
        {
          "name": "time",
          "abbreviation": "T",
          "direction": "future",
          "time": {
            "reference": "days since 1900-01-01",
            "calendar": "standard"
          },
          "values": {
            "external": {
              "ref": {
                "array": "time"
              }
            }
          }
        }
      ]
    }
  }
}
```

#### Array: Referencing the coordinate system
```
{
  "zarr_format": 3,
  "node_type": "array",
  "dimension_names": ["time", "lat", "lon"],
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/schema.json",
        "name": "cs"
      },
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
        "name": "ref"
      }
    ],
    "cs": {
      "composite": {
        "ref": {
          "group": "/",
          "attribute": "/attributes/cs/CRU_cs"
        }
      }
    }
  }
}
```

### HadUK-Grid Climatological data by geographic region
Data set: sun_hadukgrid_uk_river_ann-30y_199101-202012

A climatological dataset by geographic regions, summarised to a single date-time instant. The "time" axis is represented in the Zarr array, even though it has a length of 1.

```
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [1, 23],
  "dimension_names": ["time", "geo_region"],
  "attributes": {
    "zarr_conventions": [
      {
        "schema_url": "https://raw.githubusercontent.com/R-CF/zarr_convention_cs/tags/v1/schema.json",
        "name": "cs"
      }
    ],
    "cs": {
      "axes": [
        {
          "name": "geo_region",
          "values": {
            "explicit": ["Anglian", "Argyll", "Clyde", "Dee", "Forth", "Humber", "Neagh Bann", "North East Scotland", "North Eastern Ireland", "North Highland", "North West England", "North Western Ireland", "Northumbria", "Orkney and Shetland", "Severn", "Solway", "South East England", "South West England", "Tay", "Thames", "Tweed", "West Highland", "Western Wales"]
          }
        },
        {
          "name": "time",
          "abbreviation": "T",
          "direction": "future",
          "time": {
            "reference": "hours since 1800-01-01",
            "calendar": "standard"
          },
          "values": {
            "explicit": [1678608]
          },
          "boundaries": {
            "explicit": [1674264, 1937232]
          }
        }
      ]
    }
  }
}
```

## Known Implementations

_If you implement or use this convention, please add your implementation to this list by opening an issue or submitting a pull request._

## Acknowledgements

This template is based on the [STAC extensions template](https://github.com/stac-extensions/template/blob/main/README.md).
