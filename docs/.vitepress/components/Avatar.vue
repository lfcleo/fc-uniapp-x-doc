<template>
    <a :href="link" target="_blank">
        <img class="avatar" :src="src" :alt="title" :title="title" />
        <span>{{ title }}</span>
    </a>
</template>

<script setup lang="ts">
const props = defineProps<{ src: string; title: string; link: string }>();

console.log(props.title)
</script>

<style scoped>
a {
    padding-right: 10px;
}

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 25px;
    cursor: pointer;
    display: inline-block;
}
</style>