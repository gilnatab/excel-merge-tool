<template>
  <template v-if="rows.length === 0">
    <p style="color:#888;text-align:center;padding:20px;">无数据</p>
  </template>
  <div v-else class="table-scroll">
    <table>
      <thead>
        <tr><th v-for="c in cols" :key="c">{{ c }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td v-for="c in cols" :key="c">{{ row[c] ?? '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Array, required: true },
  cols: { type: Array, required: true },
});
</script>
