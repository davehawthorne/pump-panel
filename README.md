# Boronia Pumper Tanker Simulator

This is a crude simulator to aid students in understanding some aspects of pump operation and hydraulics.  It is no substitute for time operating a real pump.

Requirements:

- reasonably recent computer with reasonably recent web browser (IE9, firefox)
- no software installation required

Limitations:

- presently there are no dynamic effects such as water hammer or line charging.
- there is no sound - a major weakness as listening to the pump and valves is an important part of operation.
  To partly compensate I've included extra visual feedback such as engine revs.
- the physics still needs some major tweaking - factors such as hose loss and pump performance are currently broad estimates
- foam induction is not yet included
- the following are not plumbed in: high pressure outlet, crew protection, spray bar, midship outlets including monitor.
- there is no model for kinked/flaked/poorly dressed hose - possibly bigger effect than elevation
- older browsers (eg IE8) do not have the required graphics capability (Scalar Vector Graphics, SVG)
- the physics engine could place a heavy drain on slower computers - your mileage may vary

Setup:

- When operating with reticulated supply, there are 4 charged lines of 65mm from hydrant/pump relay into the truck, two into the 125mm inlet.
  Use inlet valves to select how many are flowing.

Implementation:

- graphics generated with SVG
- coded in Javascript
