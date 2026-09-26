<template>
  <!-- Lumalabas lang pagkatapos mag-scroll pababa, at nasa kaliwa ng chat
       button para hindi sila magpatungan. Hiningi ni Jyan: mahaba yung mga
       lesson, nakakapagod bumalik sa taas. -->
  <button
    v-show="show"
    type="button"
    class="back-to-top"
    aria-label="Back to top"
    @click="toTop"
  >
    ↑
  </button>
</template>

<script src="./BackToTop.js"></script>
